import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Plus, Trash2 } from "lucide-react";

interface Variant {
  id?: string;
  name: string;   // e.g. "Size"
  value: string;  // e.g. "XL"
  price_modifier: string;
  stock_quantity: string;
  is_active: boolean;
}

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
  supplier_id: string;
  supplier_sku: string;
  supplier_cost: string;
  weight_grams: string;
}

interface ProductFormProps {
  editingProduct?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ editingProduct, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

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
    supplier_id: "",
    supplier_sku: "",
    supplier_cost: "",
    weight_grams: "",
  });

  useEffect(() => {
    loadCategories();
    loadSuppliers();
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
        supplier_id: "",
        supplier_sku: "",
        supplier_cost: "",
        weight_grams: editingProduct.weight_grams?.toString() || "",
      });
      setImagePreview(editingProduct.image_url || "");
      loadVariants(editingProduct.id);
      loadSupplierLink(editingProduct.id);
    }
  }, [editingProduct]);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, name").eq("is_active", true);
    setSuppliers(data || []);
  };

  const loadVariants = async (productId: string) => {
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");
    if (data) {
      setVariants(data.map((v) => ({
        id: v.id,
        name: v.name,
        value: v.value,
        price_modifier: v.price_modifier.toString(),
        stock_quantity: v.stock_quantity.toString(),
        is_active: v.is_active,
      })));
    }
  };

  const loadSupplierLink = async (productId: string) => {
    const { data } = await supabase
      .from("supplier_products")
      .select("supplier_id, supplier_sku, supplier_cost")
      .eq("product_id", productId)
      .maybeSingle();
    if (data) {
      setForm((f) => ({
        ...f,
        supplier_id: data.supplier_id || "",
        supplier_sku: data.supplier_sku || "",
        supplier_cost: data.supplier_cost?.toString() || "",
      }));
    }
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: editingProduct ? f.slug : autoSlug(name) }));
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

  // ---- Variant helpers ----
  const addVariant = () => {
    setVariants((v) => [...v, { name: "Size", value: "", price_modifier: "0", stock_quantity: "0", is_active: true }]);
  };

  const removeVariant = (index: number) => {
    const v = variants[index];
    if (v.id) setDeletedVariantIds((d) => [...d, v.id!]);
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | boolean) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let imageUrl = editingProduct?.image_url || "";
    if (imageFile) {
      const url = await uploadImage();
      if (url) imageUrl = url;
      else { setSubmitting(false); return; }
    }

    const productData = {
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

    let productId = editingProduct?.id;

    if (editingProduct) {
      const { error } = await supabase.from("products").update(productData).eq("id", productId);
      if (error) {
        toast({ title: "Error updating product", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from("products").insert([productData]).select().single();
      if (error || !data) {
        toast({ title: "Error creating product", description: error?.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      productId = data.id;
    }

    // Save supplier link
    if (form.supplier_id) {
      await supabase.from("supplier_products").upsert({
        product_id: productId,
        supplier_id: form.supplier_id,
        supplier_sku: form.supplier_sku || null,
        supplier_cost: form.supplier_cost ? parseFloat(form.supplier_cost) : null,
      }, { onConflict: "supplier_id,product_id" });
    }

    // Delete removed variants
    if (deletedVariantIds.length > 0) {
      await supabase.from("product_variants").delete().in("id", deletedVariantIds);
    }

    // Upsert variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const vData = {
        product_id: productId,
        name: v.name,
        value: v.value,
        price_modifier: parseFloat(v.price_modifier) || 0,
        stock_quantity: parseInt(v.stock_quantity) || 0,
        is_active: v.is_active,
        sort_order: i,
      };
      if (v.id) {
        await supabase.from("product_variants").update(vData).eq("id", v.id);
      } else {
        await supabase.from("product_variants").insert([vData]);
      }
    }

    toast({ title: `Product ${editingProduct ? "updated" : "created"} successfully` });
    onSuccess();
    setSubmitting(false);
  };

  const variantGroups = Array.from(new Set(variants.map((v) => v.name)));

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
                    type="button" variant="destructive" size="icon"
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
                  <Upload className="h-4 w-4" /> Replace
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

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Selling Price (R) *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Compare-at Price (R)</Label>
              <Input type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="Strikethrough" />
            </div>
            <div className="space-y-2">
              <Label>Stock *</Label>
              <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Weight (grams)</Label>
              <Input type="number" value={form.weight_grams} onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} placeholder="500" />
            </div>
          </div>

          {/* Category & Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Badge</Label>
              <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="New, Sale, Hot…" />
            </div>
          </div>

          {/* Supplier */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <p className="text-sm font-semibold">Dropshipping Supplier</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supplier SKU</Label>
                <Input value={form.supplier_sku} onChange={(e) => setForm({ ...form, supplier_sku: e.target.value })} placeholder="SUP-12345" />
              </div>
              <div className="space-y-2">
                <Label>Cost Price (R)</Label>
                <Input type="number" step="0.01" value={form.supplier_cost} onChange={(e) => setForm({ ...form, supplier_cost: e.target.value })} placeholder="Supplier cost" />
              </div>
            </div>
          </div>

          {/* Product Variants */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Product Variants</p>
                <p className="text-xs text-muted-foreground">Add size, colour, material options</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" /> Add Variant
              </Button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-3">
                {/* Group label row */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span className="col-span-3">Option Type</span>
                  <span className="col-span-3">Value</span>
                  <span className="col-span-2">+/- Price (R)</span>
                  <span className="col-span-2">Stock</span>
                  <span className="col-span-1">Active</span>
                  <span className="col-span-1"></span>
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <Select value={v.name} onValueChange={(val) => updateVariant(i, "name", val)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Size", "Colour", "Material", "Style", "Pack Size"].map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input className="h-8 text-sm" value={v.value} onChange={(e) => updateVariant(i, "value", e.target.value)} placeholder="e.g. XL, Red" />
                    </div>
                    <div className="col-span-2">
                      <Input className="h-8 text-sm" type="number" step="0.01" value={v.price_modifier} onChange={(e) => updateVariant(i, "price_modifier", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input className="h-8 text-sm" type="number" value={v.stock_quantity} onChange={(e) => updateVariant(i, "stock_quantity", e.target.value)} />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Switch checked={v.is_active} onCheckedChange={(val) => updateVariant(i, "is_active", val)} />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeVariant(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Variant summary badges */}
                {variantGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {variantGroups.map((g) => (
                      <Badge key={g} variant="secondary" className="text-xs">
                        {g}: {variants.filter((v) => v.name === g).map((v) => v.value).join(", ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {variants.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">
                No variants — product is a single item. Click "Add Variant" to add sizes/colours.
              </p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label>Product is active and visible in store</Label>
          </div>

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
