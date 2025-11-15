import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import ProductDetail from "./pages/ProductDetail";
import Category from "./pages/Category";
import Search from "./pages/Search";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import TrackOrder from "./pages/TrackOrder";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import SizeGuide from "./pages/SizeGuide";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Products from "./pages/Products";
import NewArrivals from "./pages/NewArrivals";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import AdminProducts from "./pages/AdminProducts";
import AdminCategories from "./pages/AdminCategories";
import AdminOrders from "./pages/AdminOrders";
import AdminDiscounts from "./pages/AdminDiscounts";
import Analytics from "./pages/Analytics";
import Loyalty from "./pages/Loyalty";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <FloatingChatButton />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/products" element={<Products />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/discounts" element={<AdminDiscounts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route path="/compare" element={<Compare />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
