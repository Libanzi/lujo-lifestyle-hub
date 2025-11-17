import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const WordPressAuthSchema = z.object({
  wordpressToken: z.string()
    .min(1, "WordPress token is required")
    .max(2000, "Token too long"),
  wordpressUrl: z.string()
    .url("Invalid WordPress URL")
    .min(1, "WordPress URL is required")
    .max(500, "URL too long")
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      "URL must start with http:// or https://"
    ),
});

interface WordPressUser {
  id: number;
  email: string;
  name: string;
  username: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input with Zod
    const validation = WordPressAuthSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid input',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { wordpressToken, wordpressUrl } = validation.data;

    // Verify WordPress JWT token and get user info
    const wpResponse = await fetch(`${wordpressUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Bearer ${wordpressToken}`,
      },
    });

    if (!wpResponse.ok) {
      throw new Error('Invalid WordPress token');
    }

    const wpUser: WordPressUser = await wpResponse.json();

    // Validate WordPress user response
    if (!wpUser.email || !wpUser.id) {
      throw new Error('Invalid WordPress user data');
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user exists in Supabase
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(u => u.email === wpUser.email);

    let supabaseUser;
    
    if (existingUser) {
      // User exists, generate token
      supabaseUser = existingUser;
      console.log('Existing Supabase user found:', supabaseUser.id);
    } else {
      // Create new user in Supabase
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: wpUser.email,
        email_confirm: true,
        user_metadata: {
          full_name: wpUser.name,
          wordpress_id: wpUser.id,
          wordpress_username: wpUser.username,
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      supabaseUser = newUser.user;
      console.log('New Supabase user created:', supabaseUser.id);
    }

    // Generate session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: wpUser.email,
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      throw sessionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          user_metadata: supabaseUser.user_metadata,
        },
        authUrl: sessionData.properties.action_link,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in wordpress-auth-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
