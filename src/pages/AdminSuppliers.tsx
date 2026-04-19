import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ExternalLink, Truck } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  api_endpoint: string | null;
  api_key: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const empty: Omit<Supplier, "id" | "created_at"> = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  api_endpoint: "",
  api_key: "",
  notes: "",
  is_active: true,
};

export default function AdminSuppliers() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");
    if (error) toast({ title: "Error loading suppliers", variant: "destructive" });
    else setSuppliers(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contact_name: s.contact_name || "",
      email: s.email || "",
      phone: s.phone || "",
      website: s.website || "",
      api_endpoint: s.api_endpoint || "",
      api_key: s.api_key || "",
      notes: s.notes || "",
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      api_endpoint: form.api_endpoint || null,
      api_key: form.api_key || null,
      notes: form.notes || null,
      is_active: form.is_active,
    };

    const { error } = editing
      ? await supabase.from("suppliers").update(payload).eq("id", editing.id)
      : await supabase.from("suppliers").insert([payload]);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Supplier ${editing ? "updated" : "created"}` });
      setDialogOpen(false);
      load();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier? This cannot be undone.")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Supplier deleted" }); load(); }
  };

  const f = (k: keyof typeof form, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <AdminLayout title="Suppliers" description={`${suppliers.length} suppliers`}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Add Supplier
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading…</div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>API</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No suppliers yet. Add your first dropshipping supplier.
                      </TableCell>
                    </TableRow>
                  ) : suppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.contact_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email || "—"}</TableCell>
                      <TableCell>
                        {s.api_endpoint ? (
                          <Badge variant="secondary" className="text-xs">API Connected</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={s.is_active ? "bg-green-500" : "bg-gray-400"}>
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {s.website && (
                            <Button size="icon" variant="ghost" asChild>
                              <a href={s.website} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Supplier Name *</Label>
                <Input value={form.name} onChange={(e) => f("name", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Contact Person</Label>
                <Input value={form.contact_name ?? ""} onChange={(e) => f("contact_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ""} onChange={(e) => f("email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone ?? ""} onChange={(e) => f("phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Website</Label>
                <Input type="url" value={form.website ?? ""} onChange={(e) => f("website", e.target.value)} placeholder="https://…" />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">API Integration (optional)</p>
              <div className="space-y-1">
                <Label>API Endpoint</Label>
                <Input value={form.api_endpoint ?? ""} onChange={(e) => f("api_endpoint", e.target.value)} placeholder="https://supplier.com/api/v1" />
              </div>
              <div className="space-y-1">
                <Label>API Key</Label>
                <Input type="password" value={form.api_key ?? ""} onChange={(e) => f("api_key", e.target.value)} placeholder="sk-…" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes ?? ""} onChange={(e) => f("notes", e.target.value)} rows={3} placeholder="Internal notes about this supplier…" />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => f("is_active", v)} />
              <Label>Supplier is active</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Supplier"}</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
