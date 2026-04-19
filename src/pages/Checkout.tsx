import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { HCaptchaComponent, HCaptchaHandle } from "@/components/HCaptcha";

const VAT_RATE = 0.15;

interface CartItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; price: number; image_url: string };
}

interface ShippingZone {
  id: string;
  name: string;
  provinces: string[];
  rate: number;
  free_above: number | null;
  estimated_days_min: number;
  estimated_days_max: number;
}

const DEFAULT_ZONE: ShippingZone = {
  id: "default",
  name: "Standard Delivery",
  provinces: [],
  rate: 99,
  free_above: 700,
  estimated_days_min: 3,
  estimated_days_max: 7,
};

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<ShippingZone>(DEFAULT_ZONE);
  const captchaRef = useRef<HCaptchaHandle>(null);

  useEffect(() => { checkUser(); loadShippingZones(); }, []);

  useEffect(() => { detectZone(); }, [shippingAddress, shippingZones]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) loadCart();
    else navigate("/auth");
  };

  const loadShippingZones = async () => {
    const { data } = await supabase.from("shipping_zones").select("*").eq("is_active", true);
    setShippingZones(data || []);
  };

  const detectZone = () => {
    if (!shippingAddress.trim() || shippingZones.length === 0) {
      setSelectedZone(DEFAULT_ZONE);
      return;
    }
    const lower = shippingAddress.toLowerCase();
    const matched = shippingZones.find((z) =>
      z.provinces.some((p) => lower.includes(p))
    );
    setSelectedZone(matched || DEFAULT_ZONE);
  };

  const loadCart = async () => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products (id, name, price, image_url)");
      if (error) throw error;
      if (!data || data.length === 0) { navigate("/cart"); return; }
      setCartItems(data);
    } catch (err: any) {
      toast({ title: "Error loading cart", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const subtotal = () => cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const shippingCost = () => {
    const sub = subtotal();
    const zone = selectedZone;
    if (zone.free_above !== null && sub >= zone.free_above) return 0;
    return zone.rate;
  };

  const discountAmount = () => appliedDiscount?.amount || 0;

  const vatableAmount = () => subtotal() - discountAmount() + shippingCost();

  const vatAmount = () => parseFloat((vatableAmount() * VAT_RATE).toFixed(2));

  const orderTotal = () => parseFloat((vatableAmount() + vatAmount()).toFixed(2));

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setCheckingDiscount(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-discount", {
        body: { code: discountCode, subtotal: subtotal() },
      });
      if (error) throw error;
      if (data.valid) {
        setAppliedDiscount(data.discount);
        toast({ title: "Discount applied!", description: `You saved R${data.discount.amount.toFixed(2)}` });
      } else {
        toast({ title: "Invalid discount code", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error applying discount", description: err.message, variant: "destructive" });
    } finally {
      setCheckingDiscount(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      toast({ title: "Error", description: "Please enter a shipping address", variant: "destructive" });
      return;
    }
    if (!captchaToken) { captchaRef.current?.execute(); return; }

    setSubmitting(true);
    try {
      const { data: captchaResult, error: captchaError } = await supabase.functions.invoke("verify-captcha", {
        body: { token: captchaToken },
      });
      if (captchaError || !captchaResult?.success) throw new Error("Captcha verification failed.");

      const orderNumber = `ORD-${Date.now()}`;
      const total = orderTotal();
      const vat = vatAmount();
      const shipping = shippingCost();
      const discount = discountAmount();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total_amount: total,
          shipping_address: shippingAddress,
          status: "pending",
          discount_code: appliedDiscount?.code || null,
          discount_amount: discount,
          shipping_cost: shipping,
          vat_amount: vat,
          vat_rate: VAT_RATE,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const { error: itemsError } = await supabase.from("order_items").insert(
        cartItems.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        }))
      );
      if (itemsError) throw itemsError;

      if (appliedDiscount?.code) {
        await supabase.rpc("increment_discount_uses", { discount_code: appliedDiscount.code }).catch(console.error);
      }

      if (paymentMethod === "cod") {
        await supabase.from("orders").update({ payment_method: "cod", payment_status: "pending" }).eq("id", order.id);
        await supabase.from("cart_items").delete().in("id", cartItems.map((i) => i.id));
        await supabase.functions.invoke("send-order-email", { body: { orderId: order.id, type: "confirmation" } }).catch(console.error);
        await supabase.functions.invoke("process-loyalty-points", { body: { userId: user.id, orderId: order.id, orderAmount: total } }).catch(console.error);
        toast({ title: "Order placed!", description: "We'll be in touch soon. You pay on delivery." });
        navigate("/orders?success=true");
      } else if (paymentMethod === "payfast") {
        const { data: pd, error: pe } = await supabase.functions.invoke("process-payfast-payment", {
          body: { orderId: order.id, amount: total, returnUrl: `${window.location.origin}/orders?success=true`, cancelUrl: `${window.location.origin}/checkout?cancelled=true`, notifyUrl: `${window.location.origin}/api/payfast-webhook` },
        });
        if (pe) throw pe;
        const form = document.createElement("form");
        form.method = "POST"; form.action = pd.paymentUrl;
        Object.entries(pd.paymentData).forEach(([k, v]) => {
          const inp = document.createElement("input"); inp.type = "hidden"; inp.name = k; inp.value = v as string; form.appendChild(inp);
        });
        document.body.appendChild(form); form.submit();
      } else if (paymentMethod === "stripe") {
        const { data: pd, error: pe } = await supabase.functions.invoke("process-stripe-payment", {
          body: { orderId: order.id, successUrl: `${window.location.origin}/orders?success=true`, cancelUrl: `${window.location.origin}/checkout?cancelled=true` },
        });
        if (pe) throw pe;
        window.location.href = pd.sessionUrl;
      }
    } catch (err: any) {
      toast({ title: "Error processing order", description: err.message, variant: "destructive" });
      setCaptchaToken(""); captchaRef.current?.resetCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    const form = document.querySelector("form");
    if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading checkout…</p>
        </div>
        <Footer />
      </div>
    );
  }

  const sub = subtotal();
  const ship = shippingCost();
  const disc = discountAmount();
  const vat = vatAmount();
  const total = orderTotal();
  const isFreeShipping = selectedZone.free_above !== null && sub >= selectedZone.free_above;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: address + payment */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Shipping & Payment</h2>
                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div>
                      <Label htmlFor="address">Shipping Address</Label>
                      <Textarea
                        id="address"
                        placeholder="Street address, suburb, city, province, postal code"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        required rows={4}
                      />
                      {shippingAddress.trim() && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          <span>
                            {selectedZone.name} · {isFreeShipping ? "Free shipping" : `R${ship.toFixed(2)}`} ·{" "}
                            {selectedZone.estimated_days_min}–{selectedZone.estimated_days_max} business days
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Payment Method</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2 space-y-2">
                        {[
                          { value: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order" },
                          { value: "payfast", label: "PayFast", desc: "Secure SA payment gateway" },
                          { value: "stripe", label: "Credit / Debit Card", desc: "Powered by Stripe" },
                        ].map((m) => (
                          <div key={m.value} className="flex items-center space-x-2 border rounded-lg p-4">
                            <RadioGroupItem value={m.value} id={m.value} />
                            <Label htmlFor={m.value} className="flex-1 cursor-pointer">
                              <div className="font-medium">{m.label}</div>
                              <div className="text-sm text-muted-foreground">{m.desc}</div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <HCaptchaComponent
                      ref={captchaRef}
                      onVerify={handleCaptchaVerify}
                      onError={() => { setCaptchaToken(""); toast({ title: "Captcha error. Please refresh.", variant: "destructive" }); }}
                      onExpire={() => setCaptchaToken("")}
                    />

                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                      {submitting ? "Processing…" : paymentMethod === "cod" ? "Place Order" : "Continue to Payment"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right: order summary */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <img src={item.product.image_url} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">R{(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Discount Code */}
                  <div className="border-t pt-4 space-y-2">
                    <Label htmlFor="discount">Discount Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discount" placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        disabled={!!appliedDiscount}
                      />
                      <Button type="button" variant="outline" onClick={handleApplyDiscount}
                        disabled={checkingDiscount || !!appliedDiscount || !discountCode.trim()}>
                        {checkingDiscount ? "…" : appliedDiscount ? "✓" : "Apply"}
                      </Button>
                    </div>
                    {appliedDiscount && (
                      <div className="flex items-center justify-between text-sm text-green-600">
                        <span>✓ {appliedDiscount.description || appliedDiscount.code}</span>
                        <button type="button" onClick={() => { setAppliedDiscount(null); setDiscountCode(""); }} className="underline">Remove</button>
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>R{sub.toFixed(2)}</span>
                    </div>
                    {disc > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedDiscount.code})</span>
                        <span>-R{disc.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Shipping
                        {shippingAddress.trim() && (
                          <span className="ml-1 text-xs">({selectedZone.name})</span>
                        )}
                      </span>
                      {isFreeShipping ? (
                        <span className="text-green-600 font-medium">Free</span>
                      ) : (
                        <span>R{ship.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT (15%)</span>
                      <span>R{vat.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">R{total.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">VAT inclusive</p>
                  </div>

                  {/* Shipping zone info */}
                  {shippingAddress.trim() && selectedZone.free_above && !isFreeShipping && (
                    <div className="mt-3 p-2 bg-muted rounded text-xs text-muted-foreground">
                      Spend R{(selectedZone.free_above - sub).toFixed(2)} more for free shipping
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
