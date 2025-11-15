import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateDiscountRequest {
  code: string;
  subtotal: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { code, subtotal }: ValidateDiscountRequest = await req.json();

    // Get discount code
    const { data: discount, error: discountError } = await supabaseClient
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (discountError || !discount) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid or expired discount code' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if expired
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This discount code has expired' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check max uses
    if (discount.max_uses && discount.uses_count >= discount.max_uses) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This discount code has reached its usage limit' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check minimum purchase amount
    if (discount.min_purchase_amount && subtotal < discount.min_purchase_amount) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Minimum purchase amount of R${discount.min_purchase_amount} required` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = (subtotal * discount.discount_value) / 100;
    } else {
      discountAmount = discount.discount_value;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    console.log('Discount validated:', code, 'Amount:', discountAmount);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        discount: {
          code: discount.code,
          description: discount.description,
          type: discount.discount_type,
          value: discount.discount_value,
          amount: discountAmount,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error validating discount:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Error validating discount code' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
