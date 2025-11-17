import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { wordpressToken, wordpressUrl } = await req.json();

    if (!wordpressToken || !wordpressUrl) {
      throw new Error('WordPress token and URL are required');
    }

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
