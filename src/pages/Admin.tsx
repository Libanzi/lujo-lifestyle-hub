import { AdminLayout } from "@/components/admin/AdminLayout";
import { LowStockAlert } from "@/components/LowStockAlert";
import { ReorderSuggestions } from "@/components/ReorderSuggestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Layers, ShoppingBag, Percent, BarChart3, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, orders: 0, categories: 0 });

  useEffect(() => {
    const load = async () => {
      const [p, o, c] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        products: p.count || 0,
        orders: o.count || 0,
        categories: c.count || 0,
      });
    };
    load();
  }, []);

  const quickStats = [
    { label: "Total Products", value: stats.products, icon: Package, color: "text-blue-500" },
    { label: "Total Orders", value: stats.orders, icon: ShoppingBag, color: "text-green-500" },
    { label: "Categories", value: stats.categories, icon: Layers, color: "text-purple-500" },
  ];

  return (
    <AdminLayout title="Dashboard" description="Welcome back to your store management">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <LowStockAlert />
        <ReorderSuggestions />
      </div>
    </AdminLayout>
  );
};

export default Admin;
