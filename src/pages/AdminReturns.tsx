import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const RETURN_STATUSES = ["requested", "approved", "rejected", "received", "refunded"];

const statusColor: Record<string, string> = {
  requested: "bg-yellow-500",
  approved: "bg-blue-500",
  rejected: "bg-red-500",
  received: "bg-purple-500",
  refunded: "bg-green-500",
};

const reasonLabels: Record<string, string> = {
  wrong_item: "Wrong Item",
  damaged: "Damaged / Defective",
  not_as_described: "Not as Described",
  changed_mind: "Changed Mind",
  other: "Other",
};

export default function AdminReturns() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveForm, setResolveForm] = useState({ status: "", refund_amount: "", admin_notes: "" });
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("returns")
      .select("*, order:orders(order_number, total_amount)")
      .order("requested_at", { ascending: false });
    if (error) toast({ title: "Error loading returns", variant: "destructive" });
    else setReturns(data || []);
    setLoading(false);
  };

  const openResolve = (r: any) => {
    setSelected(r);
    setResolveForm({ status: r.status, refund_amount: r.refund_amount?.toString() || "", admin_notes: r.admin_notes || "" });
    setDialogOpen(true);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setResolving(true);
    const { error } = await supabase.from("returns").update({
      status: resolveForm.status,
      refund_amount: resolveForm.refund_amount ? parseFloat(resolveForm.refund_amount) : null,
      admin_notes: resolveForm.admin_notes || null,
      resolved_at: resolveForm.status === "refunded" ? new Date().toISOString() : null,
    }).eq("id", selected.id);

    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Return updated" }); setDialogOpen(false); load(); }
    setResolving(false);
  };

  const filtered = filterStatus === "all" ? returns : returns.filter((r) => r.status === filterStatus);

  return (
    <AdminLayout title="Returns & Refunds" description={`${returns.length} total return requests`}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {RETURN_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading…</div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No return requests
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}…</TableCell>
                      <TableCell className="font-medium">
                        #{r.order?.order_number}
                        <p className="text-xs text-muted-foreground">R{r.order?.total_amount?.toFixed(2)}</p>
                      </TableCell>
                      <TableCell>{reasonLabels[r.reason] || r.reason}</TableCell>
                      <TableCell>
                        <Badge className={statusColor[r.status] || "bg-gray-400"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.refund_amount ? `R${parseFloat(r.refund_amount).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.requested_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openResolve(r)}>
                          Resolve
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Return — #{selected?.order?.order_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-1 text-sm text-muted-foreground mb-4">
              <p><strong>Reason:</strong> {reasonLabels[selected.reason] || selected.reason}</p>
              {selected.reason_detail && <p><strong>Details:</strong> {selected.reason_detail}</p>}
            </div>
          )}
          <form onSubmit={handleResolve} className="space-y-4">
            <div className="space-y-1">
              <Label>Update Status</Label>
              <Select value={resolveForm.status} onValueChange={(v) => setResolveForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RETURN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Refund Amount (R)</Label>
              <Input type="number" step="0.01" value={resolveForm.refund_amount}
                onChange={(e) => setResolveForm((f) => ({ ...f, refund_amount: e.target.value }))}
                placeholder="Leave blank if no refund" />
            </div>
            <div className="space-y-1">
              <Label>Admin Notes</Label>
              <Textarea value={resolveForm.admin_notes}
                onChange={(e) => setResolveForm((f) => ({ ...f, admin_notes: e.target.value }))}
                rows={3} placeholder="Internal notes about this return…" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={resolving}>{resolving ? "Saving…" : "Save"}</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
