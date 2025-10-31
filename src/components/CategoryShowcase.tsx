import { Card } from "@/components/ui/card";

const categories = [
  {
    name: "Fashion & Apparel",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050",
    items: "2,500+ Products"
  },
  {
    name: "Home & Lifestyle",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a",
    items: "1,800+ Products"
  },
  {
    name: "Electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661",
    items: "950+ Products"
  },
  {
    name: "Beauty & Care",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
    items: "1,200+ Products"
  }
];

export const CategoryShowcase = () => {
  return (
    <section className="py-20 px-4">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Shop by Category</h2>
          <p className="text-muted-foreground text-lg">Discover our curated collections</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Card 
              key={index}
              className="group relative overflow-hidden cursor-pointer border-0 shadow-[var(--shadow-luxury)] hover:shadow-[var(--shadow-gold-glow)] transition-all duration-500"
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                  <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                  <p className="text-sm text-primary-foreground/80">{category.items}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
