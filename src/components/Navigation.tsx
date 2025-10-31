import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, User, Heart, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadCartCount();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadCartCount();
      } else {
        setCartCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCartCount = async () => {
    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true });
    setCartCount(count || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <a href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--luxury-gold))] to-[hsl(var(--luxury-champagne))] bg-clip-text text-transparent">
              LUJO
            </span>
          </a>
          
          <nav className="hidden md:flex gap-6">
            <a href="#" className="text-sm font-medium transition-colors hover:text-[hsl(var(--luxury-gold))]">
              New Arrivals
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-[hsl(var(--luxury-gold))]">
              Fashion
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-[hsl(var(--luxury-gold))]">
              Home & Living
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-[hsl(var(--luxury-gold))]">
              Electronics
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-[hsl(var(--luxury-gold))]">
              Beauty
            </a>
            <a href="#" className="text-sm font-medium text-[hsl(var(--luxury-gold))] hover:text-[hsl(var(--luxury-champagne))]">
              Sale
            </a>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
          {user ? (
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
              <User className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--luxury-gold))] text-[10px] font-bold text-primary flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
