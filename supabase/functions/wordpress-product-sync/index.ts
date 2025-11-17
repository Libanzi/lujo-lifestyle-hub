import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { FunctionLogger } from "../_shared/function-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WordPressSyncSchema = z.object({
  wordpressUrl: z.string().url("Invalid WordPress URL"),
  syncMode: z.enum(['full', 'incremental']).default('incremental'),
  categoryMapping: z.record(z.string()).optional(),
  syncCategories: z.boolean().default(true),
});

interface WordPressProduct {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  product_meta: {
    price: string;
    original_price: string;
    stock: string;
    badge: string;
    is_active: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
    }>;
    "wp:term"?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

serve(async (req) => {
  const logger = new FunctionLogger('wordpress-product-sync');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authentication - must be admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      await logger.logError(new Error('Missing authorization'), { 
        metadata: { context: 'auth_check' }
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      await logger.logError(new Error('Invalid user'), { 
        metadata: { context: 'user_verification' }
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: roleData } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!roleData) {
      await logger.logError(new Error('Not an admin'), { 
        user_id: user.id,
        metadata: { context: 'admin_check' }
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const body = await req.json();
    const validation = WordPressSyncSchema.safeParse(body);

    if (!validation.success) {
      await logger.logError(new Error('Validation failed'), { 
        metadata: { errors: validation.error.errors }
      });
      return new Response(
        JSON.stringify({ success: false, error: validation.error.errors[0]?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { wordpressUrl, syncMode, categoryMapping, syncCategories } = validation.data;

    // Initialize Supabase admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const syncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      categoriesCreated: 0,
      categoriesUpdated: 0,
      errors: [] as string[],
    };

    // Sync categories first if enabled
    if (syncCategories) {
      try {
        const categoriesResponse = await fetch(
          `${wordpressUrl}/wp-json/wp/v2/lujo_product_category?per_page=100`
        );

        if (categoriesResponse.ok) {
          const wpCategories = await categoriesResponse.json();
          
          for (const wpCategory of wpCategories) {
            try {
              const { data: existingCategory } = await supabaseAdmin
                .from('categories')
                .select('id, slug')
                .eq('slug', wpCategory.slug)
                .single();

              const categoryData = {
                name: wpCategory.name,
                slug: wpCategory.slug,
                description: wpCategory.description || null,
              };

              if (existingCategory) {
                const { error } = await supabaseAdmin
                  .from('categories')
                  .update(categoryData)
                  .eq('id', existingCategory.id);

                if (error) {
                  syncResults.errors.push(`Failed to update category ${wpCategory.slug}: ${error.message}`);
                } else {
                  syncResults.categoriesUpdated++;
                }
              } else {
                const { error } = await supabaseAdmin
                  .from('categories')
                  .insert(categoryData);

                if (error) {
                  syncResults.errors.push(`Failed to create category ${wpCategory.slug}: ${error.message}`);
                } else {
                  syncResults.categoriesCreated++;
                }
              }
            } catch (error: any) {
              syncResults.errors.push(`Error processing category ${wpCategory.slug}: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        syncResults.errors.push(`Failed to fetch WordPress categories: ${error.message}`);
      }
    }

    // Fetch WordPress products
    const wpResponse = await fetch(
      `${wordpressUrl}/wp-json/wp/v2/lujo-products?per_page=100&_embed`
    );

    if (!wpResponse.ok) {
      await logger.logError(new Error('Failed to fetch WordPress products'), { 
        response_status: wpResponse.status,
        metadata: { url: wordpressUrl }
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch WordPress products' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const wpProducts: WordPressProduct[] = await wpResponse.json();
    
    // Filter active products only
    const activeProducts = wpProducts.filter(
      p => p.product_meta?.is_active === '1'
    );

    console.log('Fetched WordPress products:', { 
      total: wpProducts.length,
      active: activeProducts.length 
    });

    // Sync each product
    for (const wpProduct of activeProducts) {
      try {
        // Check if product exists
        const { data: existing } = await supabaseAdmin
          .from('products')
          .select('id, slug')
          .eq('slug', wpProduct.slug)
          .single();

        const productData = {
          name: wpProduct.title.rendered.replace(/<[^>]*>/g, ''),
          slug: wpProduct.slug,
          description: wpProduct.content.rendered,
          price: parseFloat(wpProduct.product_meta.price) || 0,
          original_price: wpProduct.product_meta.original_price 
            ? parseFloat(wpProduct.product_meta.original_price) 
            : null,
          stock_quantity: parseInt(wpProduct.product_meta.stock) || 0,
          badge: wpProduct.product_meta.badge || null,
          image_url: wpProduct._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
          is_active: true,
          category_id: null, // Will be set if category mapping exists
        };

        // Map WordPress category to Supabase category if provided
        if (wpProduct._embedded?.["wp:term"]?.[0]?.[0]?.slug) {
          const wpCategorySlug = wpProduct._embedded["wp:term"][0][0].slug;
          
          // Try to find matching category in Supabase
          const { data: category } = await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('slug', wpCategorySlug)
            .single();
          
          if (category) {
            productData.category_id = category.id;
          }
        }

        if (existing) {
          // Update existing product
          if (syncMode === 'full') {
            const { error } = await supabaseAdmin
              .from('products')
              .update(productData)
              .eq('id', existing.id);

            if (error) {
              syncResults.errors.push(`Failed to update ${wpProduct.slug}: ${error.message}`);
            } else {
              syncResults.updated++;
            }
          } else {
            syncResults.skipped++;
          }
        } else {
          // Create new product
          const { error } = await supabaseAdmin
            .from('products')
            .insert(productData);

          if (error) {
            syncResults.errors.push(`Failed to create ${wpProduct.slug}: ${error.message}`);
          } else {
            syncResults.created++;
          }
        }
      } catch (error: any) {
        syncResults.errors.push(`Error processing ${wpProduct.slug}: ${error.message}`);
      }
    }

    await logger.logSuccess({
      metadata: syncResults
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: syncResults,
        message: `Sync completed: ${syncResults.created} products created, ${syncResults.updated} updated, ${syncResults.skipped} skipped. Categories: ${syncResults.categoriesCreated} created, ${syncResults.categoriesUpdated} updated`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    await logger.logError(error, { 
      metadata: { context: 'main_handler' }
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
