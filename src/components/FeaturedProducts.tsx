import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  badge: string | null;
  slug: string;
}

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProducts();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(4);
    
    if (data) setProducts(data);
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart.",
      });
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        }, {
          onConflict: "user_id,product_id",
        });

      if (error) throw error;

      toast({
        title: "Added to cart!",
        description: "Item has been added to your cart.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground text-lg">Hand-picked luxury items just for you</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-[var(--shadow-gold-glow)] transition-all duration-300">
              <div 
                className="relative aspect-square overflow-hidden cursor-pointer"
                onClick={() => navigate(`/product/${product.slug}`)}
              >
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {product.badge && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-[hsl(var(--luxury-gold))] text-primary px-3 py-1 text-xs font-bold rounded-full">
                      {product.badge}
                    </span>
                  </div>
                )}
                <Button 
                  size="icon" 
                  variant="secondary"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <h3 
                  className="font-semibold mb-2 line-clamp-1 cursor-pointer hover:text-[hsl(var(--luxury-gold))]"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-xl font-bold text-[hsl(var(--luxury-gold))]">R{product.price.toFixed(2)}</span>
                  {product.original_price && (
                    <span className="text-sm text-muted-foreground line-through">R{product.original_price.toFixed(2)}</span>
                  )}
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-[hsl(var(--luxury-charcoal))] group"
                  onClick={() => addToCart(product.id)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="border-2">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};
