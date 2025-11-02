import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, User, Heart, Menu, LogOut, Package, X, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setIsOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <a href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--luxury-gold))] to-[hsl(var(--luxury-champagne))] bg-clip-text text-transparent">
              LUJO
            </span>
          </a>
          
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Button type="submit" size="icon" variant="ghost">
              <Search className="h-5 w-5" />
            </Button>
          </form>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} className="hidden md:flex" title="Chat with us">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/wishlist")} className="hidden md:flex" title="Wishlist">
            <Heart className="h-5 w-5" />
          </Button>
          {user && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/orders")} className="hidden md:flex" title="Orders">
              <Package className="h-5 w-5" />
            </Button>
          )}
          {user ? (
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out" className="hidden md:flex">
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => navigate("/auth")} className="hidden md:flex" title="Sign In">
              <User className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")} title="Cart">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--luxury-gold))] text-[10px] font-bold text-primary flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 px-4 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/chat"); setIsOpen(false); }}>
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat
            </Button>
            {user ? (
              <>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/wishlist"); setIsOpen(false); }}>
                  <Heart className="h-5 w-5 mr-2" />
                  Wishlist
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/orders"); setIsOpen(false); }}>
                  <Package className="h-5 w-5 mr-2" />
                  Orders
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/auth"); setIsOpen(false); }}>
                <User className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
