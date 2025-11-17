import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trash2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
}

interface CategoryMapping {
  wpSlug: string;
  wpName: string;
  supabaseCategoryId: string | null;
  autoSuggested?: boolean;
}

export const WordPressCategoryMapper = () => {
  const queryClient = useQueryClient();
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [wpUrl, setWpUrl] = useState<string>("");

  // Fetch WordPress settings to get URL
  const { data: settings } = useQuery({
    queryKey: ['wordpress-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wordpress_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch Supabase categories
  const { data: supabaseCategories = [] } = useQuery({
    queryKey: ['supabase-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as SupabaseCategory[];
    },
  });

  // Fetch WordPress categories
  const { data: wpCategories = [], isLoading: wpLoading } = useQuery({
    queryKey: ['wordpress-categories', wpUrl],
    enabled: !!wpUrl,
    queryFn: async () => {
      const response = await fetch(`${wpUrl}/wp-json/wp/v2/categories?per_page=100`);
      if (!response.ok) throw new Error('Failed to fetch WordPress categories');
      return response.json() as Promise<WordPressCategory[]>;
    },
  });

  // Load existing mappings from settings
  useEffect(() => {
    if (settings) {
      setWpUrl(settings.wordpress_url);
      const existingMappings = settings.category_mappings || {};
      
      // Initialize mappings array
      setMappings([]);
    }
  }, [settings]);

  // Update mappings when WordPress categories are loaded
  useEffect(() => {
    if (wpCategories.length > 0 && settings) {
      const existingMappings = (settings.category_mappings as Record<string, string>) || {};
      
      const newMappings = wpCategories.map(wpCat => ({
        wpSlug: wpCat.slug,
        wpName: wpCat.name,
        supabaseCategoryId: existingMappings[wpCat.slug] || null,
      }));
      
      setMappings(newMappings);
    }
  }, [wpCategories, settings]);

  // Save mappings mutation
  const saveMappingsMutation = useMutation({
    mutationFn: async () => {
      if (!settings) throw new Error('Settings not loaded');
      
      const mappingsObject = mappings.reduce((acc, mapping) => {
        if (mapping.supabaseCategoryId) {
          acc[mapping.wpSlug] = mapping.supabaseCategoryId;
        }
        return acc;
      }, {} as Record<string, string>);

      const { error } = await supabase
        .from('wordpress_settings')
        .update({ category_mappings: mappingsObject })
        .eq('id', settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress-settings'] });
      toast.success('Category mappings saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save mappings:', error);
      toast.error('Failed to save category mappings');
    },
  });

  const handleMappingChange = (wpSlug: string, supabaseCategoryId: string) => {
    setMappings(prev => 
      prev.map(mapping => 
        mapping.wpSlug === wpSlug 
          ? { ...mapping, supabaseCategoryId }
          : mapping
      )
    );
  };

  const handleRemoveMapping = (wpSlug: string) => {
    setMappings(prev => 
      prev.map(mapping => 
        mapping.wpSlug === wpSlug 
          ? { ...mapping, supabaseCategoryId: null, autoSuggested: false }
          : mapping
      )
    );
  };

  const findBestMatch = (wpName: string, wpSlug: string): string | null => {
    // Normalize strings for comparison
    const normalize = (str: string) => 
      str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    const normalizedWpName = normalize(wpName);
    const normalizedWpSlug = normalize(wpSlug);
    
    // First try exact name match
    for (const cat of supabaseCategories) {
      if (normalize(cat.name) === normalizedWpName) {
        return cat.id;
      }
    }
    
    // Then try exact slug match
    for (const cat of supabaseCategories) {
      if (normalize(cat.slug) === normalizedWpSlug) {
        return cat.id;
      }
    }
    
    // Then try partial name match
    for (const cat of supabaseCategories) {
      const normalizedCatName = normalize(cat.name);
      if (normalizedCatName.includes(normalizedWpName) || 
          normalizedWpName.includes(normalizedCatName)) {
        return cat.id;
      }
    }
    
    // Finally try partial slug match
    for (const cat of supabaseCategories) {
      const normalizedCatSlug = normalize(cat.slug);
      if (normalizedCatSlug.includes(normalizedWpSlug) || 
          normalizedWpSlug.includes(normalizedCatSlug)) {
        return cat.id;
      }
    }
    
    return null;
  };

  const handleAutoSuggest = () => {
    let matchedCount = 0;
    
    setMappings(prev => 
      prev.map(mapping => {
        // Skip if already mapped
        if (mapping.supabaseCategoryId) return mapping;
        
        const bestMatch = findBestMatch(mapping.wpName, mapping.wpSlug);
        if (bestMatch) {
          matchedCount++;
          return {
            ...mapping,
            supabaseCategoryId: bestMatch,
            autoSuggested: true
          };
        }
        return mapping;
      })
    );
    
    if (matchedCount > 0) {
      toast.success(`Auto-matched ${matchedCount} ${matchedCount === 1 ? 'category' : 'categories'}`);
    } else {
      toast.info('No matching categories found');
    }
  };

  if (!wpUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Mapping</CardTitle>
          <CardDescription>
            Please configure your WordPress URL in the Settings tab first
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (wpLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Mapping</CardTitle>
          <CardDescription>Loading WordPress categories...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Category Mapping</CardTitle>
            <CardDescription>
              Map WordPress categories to Supabase categories for automatic sync
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoSuggest}
            disabled={mappings.length === 0}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Auto-Match
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {mappings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No WordPress categories found. Make sure your WordPress site has categories configured.
            </p>
          ) : (
            mappings.map((mapping) => (
              <div key={mapping.wpSlug} className="flex items-end gap-4 border-b pb-4">
                <div className="flex-1 space-y-2">
                  <Label>WordPress Category</Label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{mapping.wpName}</div>
                    {mapping.autoSuggested && (
                      <Badge variant="secondary" className="text-xs">
                        Auto-matched
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Slug: {mapping.wpSlug}</div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <Label>Maps to Supabase Category</Label>
                  <Select
                    value={mapping.supabaseCategoryId || "none"}
                    onValueChange={(value) => {
                      const newValue = value === "none" ? "" : value;
                      setMappings(prev => 
                        prev.map(m => 
                          m.wpSlug === mapping.wpSlug 
                            ? { ...m, supabaseCategoryId: newValue, autoSuggested: false }
                            : m
                        )
                      );
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="none">No mapping</SelectItem>
                      {supabaseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {mapping.supabaseCategoryId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMapping(mapping.wpSlug)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={() => saveMappingsMutation.mutate()}
            disabled={saveMappingsMutation.isPending}
          >
            {saveMappingsMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Mappings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
