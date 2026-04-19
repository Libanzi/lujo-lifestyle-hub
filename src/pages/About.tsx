import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Heart, Users, Award, ShoppingBag, Globe, Gem, Truck, ShieldCheck, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const skills = [
  {
    icon: Gem,
    title: "Luxury Curation",
    description: "Expert selection of premium products vetted for quality, craftsmanship, and value.",
    tags: ["Product Sourcing", "Quality Assurance", "Brand Partnerships"],
  },
  {
    icon: Globe,
    title: "Global Sourcing",
    description: "Direct relationships with manufacturers across 40+ countries to bring you authentic luxury.",
    tags: ["International Logistics", "Supply Chain", "Import Compliance"],
  },
  {
    icon: ShoppingBag,
    title: "Retail Innovation",
    description: "Cutting-edge e-commerce experiences combining personalisation with intuitive design.",
    tags: ["UX Design", "Personalisation", "Omnichannel"],
  },
  {
    icon: Truck,
    title: "Fulfilment Excellence",
    description: "Fast, secure delivery with white-glove packaging that honours the luxury experience.",
    tags: ["Same-day Dispatch", "Premium Packaging", "Order Tracking"],
  },
  {
    icon: ShieldCheck,
    title: "Authenticity Guarantee",
    description: "Every item undergoes rigorous authentication and quality-control checks before listing.",
    tags: ["Authentication", "Quality Control", "Fraud Prevention"],
  },
  {
    icon: Headphones,
    title: "Concierge Support",
    description: "Dedicated lifestyle concierge team available 24/7 to personalise your shopping journey.",
    tags: ["24/7 Support", "Personal Styling", "Returns Management"],
  },
];

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-5xl">
          <h1 className="text-4xl font-bold mb-8">Our Story</h1>

          <div className="prose prose-gray max-w-none space-y-8">
            <p className="text-lg">
              Founded in 2020, LUJO was born from a simple belief: luxury should be accessible to everyone.
              We set out to create a platform where premium quality meets affordable prices, making everyday
              luxury a reality for all.
            </p>

            <div className="grid md:grid-cols-3 gap-8 my-12 not-prose">
              <div className="text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
                <h3 className="text-xl font-semibold mb-2">Passion</h3>
                <p className="text-muted-foreground">We're passionate about bringing you the finest products</p>
              </div>
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-muted-foreground">Building a community of luxury enthusiasts</p>
              </div>
              <div className="text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
                <h3 className="text-xl font-semibold mb-2">Quality</h3>
                <p className="text-muted-foreground">Uncompromising quality in every product</p>
              </div>
            </div>

            <p>
              Today, LUJO serves thousands of customers worldwide, offering everything from fashion and
              electronics to home decor and beauty products. Our commitment remains the same: to provide
              exceptional quality at prices that don't break the bank.
            </p>

            <p>
              We carefully curate each product, working directly with manufacturers to ensure you get
              the best value. Our team tests every item before it reaches our catalog, so you can shop
              with confidence.
            </p>
          </div>

          {/* Skills & Expertise Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Skills & Expertise</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                What sets LUJO apart — the core competencies we've built to deliver a truly elevated shopping experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill) => {
                const Icon = skill.icon;
                return (
                  <Card key={skill.title} className="border border-border hover:border-[hsl(var(--luxury-gold))] transition-colors duration-300 group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[hsl(var(--luxury-gold))]/10 group-hover:bg-[hsl(var(--luxury-gold))]/20 transition-colors">
                          <Icon className="h-6 w-6 text-[hsl(var(--luxury-gold))]" />
                        </div>
                        <h3 className="text-lg font-semibold">{skill.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{skill.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {skill.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs bg-[hsl(var(--luxury-gold))]/10 text-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-gold))]/20"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
