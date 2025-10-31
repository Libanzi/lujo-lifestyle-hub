import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, User, Heart, Menu } from "lucide-react";

export const Navigation = () => {
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
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--luxury-gold))] text-[10px] font-bold text-primary flex items-center justify-center">
              0
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};
