import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
}

export function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkLowStock();
    
    // Set up real-time subscription for stock changes
    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => checkLowStock()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkLowStock = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity")
        .lte("stock_quantity", 10)
        .eq("is_active", true)
        .order("stock_quantity", { ascending: true });

      if (error) throw error;
      setLowStockProducts(data || []);
    } catch (error) {
      console.error("Error checking low stock:", error);
    }
  };

  if (lowStockProducts.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Low Stock Alert</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          {lowStockProducts.length} {lowStockProducts.length === 1 ? 'product is' : 'products are'} running low on stock:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-3">
          {lowStockProducts.slice(0, 3).map((product) => (
            <li key={product.id}>
              {product.name} - Only {product.stock_quantity} left
            </li>
          ))}
          {lowStockProducts.length > 3 && (
            <li>and {lowStockProducts.length - 3} more...</li>
          )}
        </ul>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/admin/products")}
        >
          Manage Inventory
        </Button>
      </AlertDescription>
    </Alert>
  );
}
