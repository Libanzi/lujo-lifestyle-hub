import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Blog = () => {
  const posts = [
    {
      title: "Spring Fashion Trends 2025",
      excerpt: "Discover the hottest fashion trends this spring season...",
      date: "March 15, 2025",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d"
    },
    {
      title: "Home Decor Ideas for Modern Living",
      excerpt: "Transform your space with these contemporary design tips...",
      date: "March 10, 2025",
      image: "https://images.unsplash.com/photo-1556912167-f556f1f39faa"
    },
    {
      title: "Tech Gadgets That Changed Our Lives",
      excerpt: "The must-have electronics that revolutionized daily living...",
      date: "March 5, 2025",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <h1 className="text-4xl font-bold mb-8">Blog</h1>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{post.date}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{post.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
