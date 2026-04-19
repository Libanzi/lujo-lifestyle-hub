import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SendHorizonal, RefreshCw } from "lucide-react";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

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

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [forwardingOrderId, setForwardingOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { loadOrders(); loadSuppliers(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items (*, product:products (name, image_url))")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Error loading orders", variant: "destructive" }); setLoading(false); return; }

    const withProfiles = await Promise.all(
      (data || []).map(async (o) => {
        const { data: p } = await supabase.from("profiles").select("email, full_name").eq("id", o.user_id).maybeSingle();
        return { ...o, user_email: p?.email || "Unknown", user_name: p?.full_name || "Unknown" };
      })
    );
    setOrders(withProfiles);
    setLoading(false);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, name").eq("is_active", true);
    setSuppliers(data || []);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((o) => o.id)));
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkUpdating(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from("orders").update({ status: bulkStatus }).in("id", ids);
    if (error) toast({ title: "Bulk update failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: `${ids.length} orders updated to "${bulkStatus}"` });
      setSelected(new Set());
      setBulkStatus("");
      loadOrders();
    }
    setBulkUpdating(false);
  };

  const forwardToSupplier = async (orderId: string, supplierId: string) => {
    setForwardingOrderId(orderId);
    const { error } = await supabase.from("order_fulfilment_log").insert({
      order_id: orderId,
      supplier_id: supplierId,
      status: "sent",
    });
    if (error) {
      toast({ title: "Failed to log forwarding", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("orders").update({ status: "processing" }).eq("id", orderId);
      toast({ title: "Order forwarded to supplier", description: "Status updated to Processing." });
      loadOrders();
    }
    setForwardingOrderId(null);
  };

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <AdminLayout title="Orders" description={`${orders.length} total orders`}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Set status…" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!bulkStatus || bulkUpdating} onClick={handleBulkUpdate}>
                {bulkUpdating ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null}
                Apply to {selected.size}
              </Button>
            </>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading orders…</div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Forward</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No orders</TableCell>
                    </TableRow>
                  ) : filtered.map((order) => (
                    <TableRow key={order.id} className={selected.has(order.id) ? "bg-muted/40" : ""}>
                      <TableCell>
                        <Checkbox checked={selected.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} />
                      </TableCell>
                      <TableCell className="font-medium">#{order.order_number}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{order.user_name}</p>
                        <p className="text-xs text-muted-foreground">{order.user_email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor[order.status] || "bg-gray-500"}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">R{order.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {suppliers.length > 0 && order.status === "pending" ? (
                          <Select onValueChange={(supplierId) => forwardToSupplier(order.id, supplierId)}>
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue placeholder={forwardingOrderId === order.id ? "Sending…" : "Send to…"} />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
            </CardContent>
          </Card>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} open={modalOpen} onOpenChange={setModalOpen} onUpdate={loadOrders} />
      )}
    </AdminLayout>
  );
}
