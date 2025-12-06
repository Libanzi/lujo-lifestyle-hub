const colors = [
  { name: "Color 1", var: "bg-color-1", label: "Deep Black", hex: "#171717" },
  { name: "Color 2", var: "bg-color-2", label: "Charcoal", hex: "#333333" },
  { name: "Color 3", var: "bg-color-3", label: "Gray", hex: "#737373" },
  { name: "Color 4", var: "bg-color-4", label: "Light Gray", hex: "#B3B3B3" },
  { name: "Color 5", var: "bg-color-5", label: "Gold", hex: "#F5A623" },
  { name: "Color 6", var: "bg-color-6", label: "Champagne", hex: "#E4C580" },
  { name: "Color 7", var: "bg-color-7", label: "Off White", hex: "#F5F5F5" },
  { name: "Color 8", var: "bg-color-8", label: "Pure White", hex: "#FFFFFF" },
];

const ColorPalettePreview = () => {
  return (
    <div className="p-8 bg-background">
      <h2 className="text-2xl font-bold text-foreground mb-6">Color Palette</h2>
      <div className="flex gap-4">
        {colors.map((color, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-20 h-20 rounded-lg shadow-lg border border-border ${color.var}`}
            />
            <span className="mt-2 text-sm font-medium text-foreground">
              {index + 1}
            </span>
            <span className="text-xs text-muted-foreground">{color.label}</span>
            <span className="text-xs font-mono text-muted-foreground">{color.hex}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPalettePreview;
