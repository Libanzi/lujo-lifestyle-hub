import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  original_price: string;
  category_id: string;
  stock_quantity: string;
  is_active: boolean;
  badge: string;
  slug: string;
}

interface ProductFormProps {
  editingProduct?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ editingProduct, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    original_price: "",
    category_id: "",
    stock_quantity: "",
    is_active: true,
    badge: "",
    slug: "",
  });

  useEffect(() => {
    loadCategories();
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        description: editingProduct.description || "",
        price: editingProduct.price.toString(),
        original_price: editingProduct.original_price?.toString() || "",
        category_id: editingProduct.category_id || "",
        stock_quantity: (editingProduct.stock_quantity ?? 0).toString(),
        is_active: editingProduct.is_active ?? true,
        badge: editingProduct.badge || "",
        slug: editingProduct.slug,
      });
      setImagePreview(editingProduct.image_url || "");
    }
  }, [editingProduct]);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: editingProduct ? f.slug : autoSlug(name),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const ext = imageFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      toast({ title: "Image upload failed", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let imageUrl = editingProduct?.image_url || "";
    if (imageFile) {
      const url = await uploadImage();
      if (url) imageUrl = url;
      else { setSubmitting(false); return; }
    }

    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      image_url: imageUrl,
      category_id: form.category_id || null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      is_active: form.is_active,
      badge: form.badge || null,
      slug: form.slug,
    };

    const { error } = editingProduct
      ? await supabase.from("products").update(data).eq("id", editingProduct.id)
      : await supabase.from("products").insert([data]);

    if (error) {
      toast({ title: `Error ${editingProduct ? "updating" : "creating"} product`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Product ${editingProduct ? "updated" : "created"} successfully` });
      onSuccess();
    }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingProduct ? "Edit Product" : "Add New Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-28 h-28 rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => { setImageFile(null); setImagePreview(""); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
              {imagePreview && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  <Upload className="h-4 w-4" />
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Name & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>URL Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price (R) *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Compare-at Price (R)</Label>
              <Input type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="Original price" />
            </div>
            <div className="space-y-2">
              <Label>Stock *</Label>
              <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required />
            </div>
          </div>

          {/* Category & Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Badge</Label>
              <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g., New, Sale, Hot" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label>Product is active and visible in store</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting || uploading}>
              {(submitting || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? "Save Changes" : "Add Product"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
