import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_id: string | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  badge: string | null;
  slug: string;
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onRefresh: () => void;
}

export function ProductTable({ products, onEdit, onRefresh }: ProductTableProps) {
  const { toast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting product", variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      onRefresh();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !current }).eq("id", id);
    if (!error) onRefresh();
  };

  const getStockStatus = (qty: number | null) => {
    if (qty === null || qty === undefined) return { label: "N/A", variant: "outline" as const };
    if (qty === 0) return { label: "Out of stock", variant: "destructive" as const };
    if (qty <= 5) return { label: "Low stock", variant: "secondary" as const };
    return { label: `${qty} in stock`, variant: "outline" as const };
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Image</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                No products yet. Click "Add Product" to get started.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const stock = getStockStatus(product.stock_quantity);
              return (
                <TableRow key={product.id} className="group">
                  <TableCell>
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      {product.badge && <Badge variant="secondary" className="mt-1 text-[10px]">{product.badge}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-semibold text-sm">R{product.price.toFixed(2)}</p>
                      {product.original_price && (
                        <p className="text-xs text-muted-foreground line-through">R{product.original_price.toFixed(2)}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={stock.variant}>{stock.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={product.is_active ?? false}
                      onCheckedChange={() => toggleActive(product.id, product.is_active ?? false)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id, product.name)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
