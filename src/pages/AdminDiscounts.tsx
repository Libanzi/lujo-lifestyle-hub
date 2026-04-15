import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

interface Discount {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "", code: "", description: "", discount_type: "percentage",
    discount_value: 0, min_purchase_amount: 0, max_uses: "", expires_at: "", is_active: true,
  });

  useEffect(() => { loadDiscounts(); }, []);

  const loadDiscounts = async () => {
    try {
      const { data, error } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setDiscounts(data || []);
    } catch (error: any) {
      toast({ title: "Error loading discounts", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormData({ id: "", code: "", description: "", discount_type: "percentage", discount_value: 0, min_purchase_amount: 0, max_uses: "", expires_at: "", is_active: true });
  };

  const handleEdit = (discount: Discount) => {
    setFormData({
      id: discount.id, code: discount.code, description: discount.description || "",
      discount_type: discount.discount_type, discount_value: discount.discount_value,
      min_purchase_amount: discount.min_purchase_amount,
      max_uses: discount.max_uses?.toString() || "",
      expires_at: discount.expires_at ? new Date(discount.expires_at).toISOString().split('T')[0] : "",
      is_active: discount.is_active,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        code: formData.code.toUpperCase(), description: formData.description,
        discount_type: formData.discount_type, discount_value: formData.discount_value,
        min_purchase_amount: formData.min_purchase_amount,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at || null, is_active: formData.is_active,
      };

      const { error } = formData.id
        ? await supabase.from("discount_codes").update(data).eq("id", formData.id)
        : await supabase.from("discount_codes").insert(data);
      if (error) throw error;
      toast({ title: formData.id ? "Discount updated" : "Discount created" });
      resetForm();
      loadDiscounts();
    } catch (error: any) {
      toast({ title: "Error saving discount", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discount code?")) return;
    const { error } = await supabase.from("discount_codes").delete().eq("id", id);
    if (!error) { toast({ title: "Discount deleted" }); loadDiscounts(); }
  };

  return (
    <AdminLayout title="Discount Codes" description={`${discounts.length} codes`}>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Code *</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., SAVE20" required />
                </div>
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value * ({formData.discount_type === 'percentage' ? '%' : 'R'})</Label>
                  <Input type="number" step="0.01" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <Label>Min Purchase (R)</Label>
                  <Input type="number" step="0.01" value={formData.min_purchase_amount} onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input type="number" value={formData.max_uses} onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })} placeholder="Unlimited" />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Internal note" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{formData.id ? "Update" : "Create"}</Button>
                {formData.id && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {discounts.map((d) => (
            <Card key={d.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{d.code}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${d.is_active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {d.description && <p className="text-sm text-muted-foreground mb-2">{d.description}</p>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Value:</span> {d.discount_type === 'percentage' ? `${d.discount_value}%` : `R${d.discount_value}`}</div>
                      <div><span className="text-muted-foreground">Min:</span> R{d.min_purchase_amount}</div>
                      <div><span className="text-muted-foreground">Uses:</span> {d.uses_count}{d.max_uses ? ` / ${d.max_uses}` : ' / ∞'}</div>
                      {d.expires_at && <div><span className="text-muted-foreground">Expires:</span> {new Date(d.expires_at).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {discounts.length === 0 && !loading && (
            <div className="py-12 text-center text-muted-foreground">No discount codes yet.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
