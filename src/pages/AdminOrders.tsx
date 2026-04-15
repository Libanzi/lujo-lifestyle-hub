import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  order_items?: any[];
}

const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`*, order_items (*, product:products (name, image_url))`)
      .order("created_at", { ascending: false });

    if (error) { toast({ title: "Error loading orders", variant: "destructive" }); setLoading(false); return; }

    const ordersWithProfiles = await Promise.all(
      (data || []).map(async (order) => {
        const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", order.user_id).maybeSingle();
        return { ...order, user_email: profile?.email || "Unknown", user_name: profile?.full_name || "Unknown" };
      })
    );
    setOrders(ordersWithProfiles);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500", processing: "bg-blue-500", shipped: "bg-purple-500",
      delivered: "bg-green-500", cancelled: "bg-red-500",
    };
    return map[status] || "bg-gray-500";
  };

  return (
    <AdminLayout title="Orders" description={`${orders.length} total orders`}>
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading orders...</div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No orders yet</TableCell></TableRow>
                ) : orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{order.user_name}</p>
                        <p className="text-xs text-muted-foreground">{order.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">R{order.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setModalOpen(true); }}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} open={modalOpen} onOpenChange={setModalOpen} onUpdate={loadOrders} />
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
