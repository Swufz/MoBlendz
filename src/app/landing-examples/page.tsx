"use client";

import Image from "next/image";
import { useState } from "react";

const categories = ["All", "Barbershop", "Ecommerce", "Travel", "SaaS", "Creative", "Fantasy", "Web3"];

const examples = [
  {
    title: "Honoured Tradition",
    category: "Barbershop",
    image: "/landing-examples/honoured-tradition.png",
    alt: "Dark barbershop landing page with a close crop beard portrait and bold Honored Tradition headline.",
    width: 810,
    height: 427,
    description:
      "A dramatic premium barbershop hero built around a centered beard portrait, oversized condensed type, and high-contrast black space.",
    tags: {
      Visuals: ["close-crop portrait", "bold hero type", "pill navigation", "circular CTA", "deep shadows"],
      Feel: ["heritage", "masculine", "premium", "cinematic", "focused"],
      Colors: ["black", "white", "warm skin tones", "charcoal", "subtle cream"],
    },
  },
  {
    title: "Iron & Ivy",
    category: "Barbershop",
    image: "/landing-examples/iron-and-ivy.png",
    alt: "Landing page concept with an orange clipper surrounded by green ivy leaves.",
    width: 1027,
    height: 748,
    description:
      "A product-led landing page with botanical framing, editorial labels, and a striking orange-and-green identity system.",
    tags: {
      Visuals: ["product macro", "ivy frame", "editorial labels", "center composition", "soft background"],
      Feel: ["fresh", "crafted", "organic", "design-forward", "refined"],
      Colors: ["terracotta orange", "ivy green", "sage gray", "white", "leaf shadows"],
    },
  },
  {
    title: "The Gentleman's Club",
    category: "Barbershop",
    image: "/landing-examples/gentlemans-club.png",
    alt: "Barbershop landing page with large cream typography, portrait, and service pricing list.",
    width: 1024,
    height: 768,
    description:
      "A classic grooming landing page mixing oversized editorial typography, a vintage portrait, and an immediate service menu.",
    tags: {
      Visuals: ["oversized headline", "profile portrait", "price list", "thin dividers", "minimal nav"],
      Feel: ["classic", "tailored", "club-like", "confident", "polished"],
      Colors: ["deep green", "cream", "copper hair", "muted gold", "off-white"],
    },
  },
  {
    title: "Cloud Sneaker",
    category: "Ecommerce",
    image: "/landing-examples/cloud-sneaker.png",
    alt: "Sneaker ecommerce landing page with a pink shoe floating above pastel clouds.",
    width: 1200,
    height: 1200,
    description:
      "A playful product hero that makes the sneaker the focal point through a surreal cloud scene and oversized translucent lettering.",
    tags: {
      Visuals: ["floating product", "cloud scene", "oversized type", "rounded frame", "minimal navigation"],
      Feel: ["playful", "dreamy", "youthful", "energetic", "commercial"],
      Colors: ["sky blue", "bubblegum pink", "white", "soft gray", "black"],
    },
  },
  {
    title: "Noto Nature Park",
    category: "Travel",
    image: "/landing-examples/noto-nature.jfif",
    alt: "Illustrated travel landing page with mountains, birds, water, and a lone explorer.",
    width: 720,
    height: 540,
    description:
      "An illustrated destination hero that uses layered scenery, a traveler silhouette, and strong editorial type to invite exploration.",
    tags: {
      Visuals: ["scenic illustration", "layered landscape", "traveler figure", "large serif type", "story-led hero"],
      Feel: ["adventurous", "warm", "cinematic", "inviting", "imaginative"],
      Colors: ["violet", "sunset orange", "gold", "deep blue", "lavender"],
    },
  },
  {
    title: "Verdant",
    category: "SaaS",
    image: "/landing-examples/verdant-saas.png",
    alt: "Dark green SaaS landing page with moss photography, glowing controls, and three feature panels.",
    width: 736,
    height: 1034,
    description:
      "A polished SaaS page that connects data intelligence with organic growth through moss photography, luminous accents, and feature panels.",
    tags: {
      Visuals: ["immersive photography", "glass panels", "feature diagrams", "centered hero", "glowing CTA"],
      Feel: ["intelligent", "sustainable", "premium", "calm", "trustworthy"],
      Colors: ["near black", "moss green", "acid lime", "soft white", "charcoal"],
    },
  },
  {
    title: "EOSAI",
    category: "Creative",
    image: "/landing-examples/eosai-creative.png",
    alt: "Creative studio landing page with a surreal portal, planets, clouds, and reflective water.",
    width: 736,
    height: 589,
    description:
      "A cinematic studio hero built around a surreal portal landscape, restrained copy, and expansive negative space.",
    tags: {
      Visuals: ["surreal landscape", "monolithic portal", "planet forms", "reflective water", "minimal overlay"],
      Feel: ["futuristic", "mysterious", "cinematic", "serene", "conceptual"],
      Colors: ["slate blue", "peach light", "steel gray", "cloud white", "deep navy"],
    },
  },
  {
    title: "Fantasy Picture Background",
    category: "Fantasy",
    image: "/landing-examples/fantasy-gallery.png",
    alt: "Fantasy image gallery landing page with neon pink and purple framed mountain artwork.",
    width: 736,
    height: 1308,
    description:
      "An immersive gallery concept using layered artwork, rounded portals, and neon framing to create a richly atmospheric browsing experience.",
    tags: {
      Visuals: ["stacked gallery", "rounded portals", "glowing outlines", "layered artwork", "download controls"],
      Feel: ["fantastical", "immersive", "vibrant", "dreamlike", "experimental"],
      Colors: ["magenta", "deep purple", "electric blue", "rose pink", "cyan"],
    },
  },
  {
    title: "XNFT Marketplace",
    category: "Web3",
    image: "/landing-examples/nft-marketplace.png",
    alt: "Dark NFT marketplace landing page with colorful digital art cards arranged in a showcase.",
    width: 735,
    height: 715,
    description:
      "A dark marketplace hero that presents collectible art as a dimensional card showcase with neon accents and futuristic display type.",
    tags: {
      Visuals: ["card showcase", "digital portraits", "angled depth", "tech typography", "compact navigation"],
      Feel: ["futuristic", "bold", "collectible", "exclusive", "high-energy"],
      Colors: ["black", "neon magenta", "electric blue", "lime green", "iridescent silver"],
    },
  },
];

export default function LandingExamplesPage() {
  const [category, setCategory] = useState("All");
  const filteredExamples = category === "All" ? examples : examples.filter((example) => example.category === category);

  return (
    <main className="min-h-screen bg-[#111310] px-4 py-8 text-[#f5efe4] sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold text-[#c89b45]">Landing page references</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Landing page design examples</h1>
          <p className="mt-4 text-base leading-7 text-[#b8b0a3]">
            Nine visual directions with tags for the look, mood, palette, and what each page communicates.
          </p>
        </header>

        <nav aria-label="Filter examples by category" className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              aria-pressed={category === item}
              className={`border px-4 py-2 text-sm font-medium transition-colors ${
                category === item
                  ? "border-[#c89b45] bg-[#c89b45] text-[#111310]"
                  : "border-white/15 bg-[#181a16] text-[#eee6da] hover:border-white/35"
              }`}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <section className="grid gap-6">
          {filteredExamples.map((example) => (
            <article
              className="grid gap-5 border border-white/10 bg-[#181a16] p-4 md:grid-cols-[1.2fr_0.8fr] md:p-5"
              key={example.title}
            >
              <Image
                src={example.image}
                alt={example.alt}
                width={example.width}
                height={example.height}
                className="h-auto w-full border border-white/10 object-cover"
                sizes="(min-width: 768px) 58vw, 100vw"
              />

              <div className="flex flex-col justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold text-[#c89b45]">{example.category}</p>
                  <h2 className="text-2xl font-semibold">{example.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#c9c0b3]">{example.description}</p>
                </div>

                <div className="grid gap-4">
                  {Object.entries(example.tags).map(([group, tags]) => (
                    <div key={group}>
                      <h3 className="text-sm font-semibold text-[#c89b45]">{group}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            className="border border-white/10 bg-black/20 px-3 py-1 text-sm text-[#eee6da]"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
