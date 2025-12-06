import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <CategoryShowcase />
      <FeaturedProducts />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
