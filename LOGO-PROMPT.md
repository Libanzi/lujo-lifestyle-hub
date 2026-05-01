# LUJO — Logo Generation Prompt

A ready-to-use prompt pack for generating the LUJO brand logo with AI image
tools (Midjourney, DALL·E, Ideogram, Stable Diffusion, Adobe Firefly) or for
briefing a human designer.

---

## Brand Snapshot

- **Name:** LUJO (Spanish/Portuguese for "luxury")
- **Tagline:** Premium Lifestyle Hub
- **Category:** High-end fashion, lifestyle and luxury e-commerce
- **Audience:** Aspirational, design-literate shoppers who value craft,
  exclusivity and understated wealth
- **Personality:** Sophisticated · Minimalist · Confident · Modern · Timeless
- **Brand colors:**
  - Deep Black `#171717` (primary)
  - Charcoal `#333333`
  - Luxury Gold `#F5A623` (HSL `38 92% 50%`) — accent / highlight
  - Champagne `#E8C77E` (HSL `43 74% 66%`) — secondary accent
  - Off White `#F5F5F5`
- **Typeface direction:** Geometric sans-serif (the site uses *Outfit*);
  the wordmark should feel related — clean, even-weighted, generous tracking.

---

## Master Prompt (copy-paste for Midjourney / DALL·E / Ideogram)

```
A minimalist luxury fashion logo for a brand called "LUJO", a premium
lifestyle and luxury e-commerce hub. Elegant geometric sans-serif wordmark
spelling L-U-J-O in uppercase, evenly tracked with refined letter spacing,
sitting on a clean canvas. The "J" subtly extends below the baseline as a
sophisticated signature flourish. Above or beside the wordmark, a small
monogram mark formed from the letter "L" interlocked with a tasteful gold
crown, diamond, or geometric emblem — restrained, not ornate. Color palette:
deep matte black and warm 24k gold with champagne highlights on an off-white
background. High-end editorial feel reminiscent of Chanel, Hermès, YSL and
Tom Ford branding. Vector-style, perfectly symmetrical, sharp clean edges,
generous negative space, no gradients on the type, subtle gold foil texture
on the emblem only. Centered composition, plenty of breathing room, suitable
for embossing on packaging, embroidery on garments, and use as a website
header. Flat design, no photorealism, no 3D, no drop shadows, no mockups.
--style raw --ar 1:1 --v 6
```

---

## Variant Prompts

### Variant 1 — Wordmark-Only (Primary Logo)

```
Luxury fashion brand wordmark "LUJO", uppercase, geometric sans-serif,
medium weight, wide letter spacing, perfectly balanced, deep matte black
on warm off-white background. The crossbar of the "J" is subtly elongated
to act as an underline beneath all four letters, suggesting refinement and
permanence. Minimalist, editorial, magazine-cover aesthetic. Pure
typography, no icons, no embellishments, vector-clean. --ar 16:9 --v 6
```

### Variant 2 — Monogram Mark (App Icon / Favicon)

```
Luxury monogram emblem for brand "LUJO". Single letter "L" rendered in
elegant geometric form, enclosed inside a thin gold circular or square
frame. Optional subtle crown, laurel, or diamond detail at the apex. Deep
black on champagne gold. Flat vector, symmetrical, suitable as a 32x32
favicon and 1024x1024 app icon. No text other than the L. Hermès-meets-
Saint-Laurent feel. --ar 1:1 --v 6
```

### Variant 3 — Combination Mark (Header / Stationery)

```
Combination luxury logo: a small gold geometric emblem (interlocked "L"
monogram inside a thin ring) sitting directly above a clean uppercase
sans-serif wordmark "LUJO". Below the wordmark, in much smaller spaced
caps, the tagline "PREMIUM LIFESTYLE HUB". Color: black wordmark, gold
emblem and tagline rule, off-white background. Editorial, balanced,
pharmacy-of-luxury aesthetic. Vector flat, no shadows. --ar 4:3 --v 6
```

### Variant 4 — Horizontal Lockup (Website Navigation)

```
Horizontal luxury logo lockup for "LUJO". Small gold emblem on the left,
followed by a thin vertical gold divider, then the wordmark "LUJO" in
matte black uppercase geometric sans-serif. Designed to sit inside a
website navigation bar 200px wide by 48px tall. Crisp vector, optimized
for both light and dark backgrounds. --ar 5:1 --v 6
```

### Variant 5 — Monochrome / Reverse (Foil Print Spec)

```
Single-color luxury logo "LUJO" in pure gold foil on solid matte black.
Wordmark only, geometric sans-serif uppercase, wide tracking, with a thin
hairline rule above and below. Designed for embossing and hot-foil
stamping on premium packaging, business cards, and shopping bags.
--ar 3:2 --v 6
```

---

## Designer Brief (for Figma / Illustrator hand-off)

If you are commissioning a human designer rather than using AI, share this:

> Design a luxury wordmark and accompanying monogram for **LUJO**, a
> premium fashion and lifestyle e-commerce brand. The mark must read as
> understated wealth — closer to Hermès, Bottega Veneta and The Row than
> to flashy streetwear. Deliver:
>
> 1. Primary wordmark (custom-tuned geometric sans, uppercase, L-U-J-O).
> 2. Monogram mark using the letter L (or LJ ligature).
> 3. Combination lockup (mark + wordmark + optional tagline
>    "PREMIUM LIFESTYLE HUB").
> 4. Horizontal navigation lockup at 200×48 px.
> 5. Vertical / stacked variant.
> 6. Single-color black, single-color gold, and reversed (gold on black)
>    versions.
> 7. Favicon optimized at 16, 32, 64, 192, 512 px.
> 8. Clear-space and minimum-size rules.
>
> **File formats:** SVG (master), PDF, PNG @1x/2x/3x, ICO favicon,
> Apple touch icon 180×180.
>
> **Colors (final):**
> - Black `#171717`
> - Gold `#F5A623`
> - Champagne `#E8C77E`
> - Off-white `#F5F5F5`
>
> **Typography reference:** the website uses *Outfit*; the wordmark
> should be a custom-tuned cousin of Outfit, Futura, Avenir Next or
> Neue Haas Grotesk — never a system default.
>
> **Don'ts:** no gradients on the wordmark, no drop shadows, no
> photorealism, no clip-art crowns, no skeuomorphism, no Comic-Sans-
> adjacent geometry, no overly thin "fashion-week 2010" hairlines that
> disappear at small sizes.

---

## Negative Prompt (paste alongside any image-gen prompt)

```
no photorealism, no 3D render, no mockup, no shopping bag, no model,
no person, no busy background, no drop shadow, no bevel, no emboss
filter, no rainbow gradient, no neon, no grunge, no watermark, no
stock-photo aesthetic, no Comic Sans, no script font, no clip-art
crown, no generic "luxury" cliché, no cluttered composition.
```

---

## Suggested Output Set

Once a direction is chosen, render or export the final logo at:

| Asset | Size | Purpose |
|-------|------|---------|
| Master SVG | vector | Source of truth |
| `logo.svg` | vector | Site header |
| `logo-dark.svg` | vector | Dark-mode header |
| `favicon.ico` | 16 / 32 / 48 | Browser tab |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `og-image.png` | 1200×630 | Open Graph / social share |
| `logo@1x/2x/3x.png` | raster | Email, fallback |

Drop the SVG into `public/` and update `index.html` `<title>` block
plus the OG meta tags to point to the new assets.
