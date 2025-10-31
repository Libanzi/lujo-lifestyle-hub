import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";

const products = [
  {
    name: "Premium Leather Watch",
    price: "R1,299",
    originalPrice: "R1,899",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    badge: "Sale"
  },
  {
    name: "Wireless Headphones",
    price: "R2,499",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    badge: "New"
  },
  {
    name: "Designer Handbag",
    price: "R3,599",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3",
    badge: "Trending"
  },
  {
    name: "Smart Home Speaker",
    price: "R1,799",
    originalPrice: "R2,299",
    image: "https://images.unsplash.com/photo-1543512214-318c7553f230",
    badge: "Sale"
  }
];

export const FeaturedProducts = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground text-lg">Hand-picked luxury items just for you</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <Card key={index} className="group overflow-hidden border-0 shadow-lg hover:shadow-[var(--shadow-gold-glow)] transition-all duration-300">
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-[hsl(var(--luxury-gold))] text-primary px-3 py-1 text-xs font-bold rounded-full">
                    {product.badge}
                  </span>
                </div>
                <Button 
                  size="icon" 
                  variant="secondary"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-xl font-bold text-[hsl(var(--luxury-gold))]">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">{product.originalPrice}</span>
                  )}
                </div>
                <Button className="w-full bg-primary hover:bg-[hsl(var(--luxury-charcoal))] group">
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
