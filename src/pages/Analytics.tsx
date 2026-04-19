import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Package, ShoppingCart, TrendingUp, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Truck, RotateCcw,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#d4af37", "#8884d8", "#82ca9d", "#ff8042", "#a4de6c"];

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  avgOrderValue: number;
  pendingOrders: number;
  totalReturns: number;
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: any[];
  ordersByStatus: { status: string; count: number }[];
  recentOrders: any[];
  thisMonthRevenue: number;
  lastMonthRevenue: number;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0,
    avgOrderValue: 0, pendingOrders: 0, totalReturns: 0,
    revenueByMonth: [], topProducts: [], ordersByStatus: [], recentOrders: [],
    thisMonthRevenue: 0, lastMonthRevenue: 0,
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [ordersRes, profilesRes, productsRes, itemsRes, returnsRes, recentRes] = await Promise.all([
        supabase.from("orders").select("total_amount, created_at, payment_status, status"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("order_items").select("product_id, quantity, price, product:products(name, image_url)"),
        supabase.from("returns").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("*, profiles!inner(full_name, email)").order("created_at", { ascending: false }).limit(8),
      ]);

      const orders = ordersRes.data || [];
      const paidOrders = orders.filter((o) => o.payment_status === "completed");
      const totalRevenue = paidOrders.reduce((s, o) => s + o.total_amount, 0);
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const avgOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;

      // Monthly revenue & order counts
      const monthlyMap: Record<string, { revenue: number; orders: number }> = {};
      paidOrders.forEach((o) => {
        const m = new Date(o.created_at).toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
        if (!monthlyMap[m]) monthlyMap[m] = { revenue: 0, orders: 0 };
        monthlyMap[m].revenue += o.total_amount;
        monthlyMap[m].orders += 1;
      });
      const revenueByMonth = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }));

      // This month vs last month
      const now = new Date();
      const thisMonth = now.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = lastMonthDate.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      const thisMonthRevenue = monthlyMap[thisMonth]?.revenue || 0;
      const lastMonthRevenue = monthlyMap[lastMonth]?.revenue || 0;

      // Top products
      const productSales: Record<string, any> = {};
      (itemsRes.data || []).forEach((item: any) => {
        if (!item.product_id) return;
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { ...item.product, name: item.product?.name, image_url: item.product?.image_url, totalSold: 0, revenue: 0 };
        }
        productSales[item.product_id].totalSold += item.quantity;
        productSales[item.product_id].revenue += item.quantity * item.price;
      });
      const topProducts = Object.values(productSales).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

      // Orders by status
      const statusMap: Record<string, number> = {};
      orders.forEach((o) => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

      setData({
        totalRevenue, totalOrders: orders.length, avgOrderValue, pendingOrders,
        totalCustomers: profilesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalReturns: returnsRes.count || 0,
        revenueByMonth, topProducts, ordersByStatus,
        recentOrders: recentRes.data || [],
        thisMonthRevenue, lastMonthRevenue,
      });
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const revChangePct = data.lastMonthRevenue
    ? ((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100
    : null;

  const statCards = [
    {
      label: "Total Revenue", value: `R${data.totalRevenue.toFixed(2)}`,
      icon: DollarSign, sub: revChangePct !== null
        ? `${revChangePct >= 0 ? "+" : ""}${revChangePct.toFixed(1)}% vs last month`
        : "Paid orders only",
      up: revChangePct !== null ? revChangePct >= 0 : null,
    },
    {
      label: "Total Orders", value: data.totalOrders,
      icon: ShoppingCart, sub: `${data.pendingOrders} pending`, up: null,
    },
    {
      label: "Avg Order Value", value: `R${data.avgOrderValue.toFixed(2)}`,
      icon: BarChart3, sub: "Paid orders only", up: null,
    },
    {
      label: "Customers", value: data.totalCustomers,
      icon: Users, sub: `${data.totalProducts} products`, up: null,
    },
    {
      label: "This Month", value: `R${data.thisMonthRevenue.toFixed(2)}`,
      icon: TrendingUp, sub: data.lastMonthRevenue ? `Last month: R${data.lastMonthRevenue.toFixed(2)}` : "First month",
      up: revChangePct !== null ? revChangePct >= 0 : null,
    },
    {
      label: "Returns", value: data.totalReturns,
      icon: RotateCcw, sub: "All time", up: null,
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Analytics Dashboard" description="Sales reports and business insights">
        <div className="py-24 text-center text-muted-foreground">Loading analytics…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics Dashboard" description="Sales reports and business insights">
      <div className="space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xl font-bold">{s.value}</div>
                {s.sub && (
                  <div className={`text-xs flex items-center gap-1 mt-1 ${s.up === true ? "text-green-600" : s.up === false ? "text-red-500" : "text-muted-foreground"}`}>
                    {s.up === true && <ArrowUpRight className="h-3 w-3" />}
                    {s.up === false && <ArrowDownRight className="h-3 w-3" />}
                    {s.sub}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue trend */}
        {data.revenueByMonth.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Orders by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" tickFormatter={(v) => `R${v}`} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(v: number, name: string) => name === "revenue" ? `R${v.toFixed(2)}` : v} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={2} name="Revenue (R)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Top Products by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No sales data yet</p>
              ) : (
                <div className="space-y-4">
                  {data.topProducts.map((p: any, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {p.image_url && <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.totalSold} sold</p>
                      </div>
                      <span className="font-semibold text-sm">R{p.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders by status */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {data.ordersByStatus.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}
                      label={(e) => `${e.status}: ${e.count}`}>
                      {data.ordersByStatus.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top products bar */}
        {data.topProducts.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Units Sold — Top Products</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `${v} units`} />
                  <Bar dataKey="totalSold" fill="#d4af37" name="Units Sold" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent orders */}
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="divide-y">
                {data.recentOrders.map((o: any) => (
                  <div key={o.id} className="flex justify-between items-start py-3">
                    <div>
                      <p className="font-medium text-sm">#{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{o.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">R{o.total_amount.toFixed(2)}</p>
                      <Badge className="text-xs mt-1" variant="secondary">{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
