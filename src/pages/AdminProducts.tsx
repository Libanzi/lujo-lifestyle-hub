import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductTable } from "@/components/admin/ProductTable";
import { LowStockAlert } from "@/components/LowStockAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search } from "lucide-react";

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  return (
    <AdminLayout
      title="Products"
      description={`${products.length} total products`}
      actions={
        !showForm ? (
          <Button size="sm" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <LowStockAlert />

        {showForm ? (
          <ProductForm
            editingProduct={editingProduct}
            onSuccess={handleSuccess}
            onCancel={() => { setShowForm(false); setEditingProduct(null); }}
          />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading products...</div>
            ) : (
              <ProductTable products={filtered} onEdit={handleEdit} onRefresh={loadProducts} />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
