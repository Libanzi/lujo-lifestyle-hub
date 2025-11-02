import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";

const TrackOrder = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-2xl">
          <div className="text-center mb-8">
            <Package className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
            <h1 className="text-4xl font-bold mb-4">Track Your Order</h1>
            <p className="text-muted-foreground">Enter your order number to track your shipment</p>
          </div>
          
          <div className="bg-card p-8 rounded-lg border">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Order Number</label>
                <Input placeholder="e.g., ORD-123456" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input type="email" placeholder="your@email.com" />
              </div>
              <Button className="w-full bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary">
                Track Order
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
