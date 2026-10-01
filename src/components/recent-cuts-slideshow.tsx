"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CardFanCarousel from "@/components/ui/card-fan-carousel";

type Cut = {
  title: string;
  image: string;
};

const useFanGallery = true;

export function RecentCutsSlideshow({ cuts }: { cuts: Cut[] }) {
  if (useFanGallery) {
    return <CardFanCarousel cards={cuts.map((cut) => ({ imgUrl: cut.image, alt: cut.title }))} />;
  }

  return <LegacyRecentCutsSlideshow cuts={cuts} />;
}

function LegacyRecentCutsSlideshow({ cuts }: { cuts: Cut[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (cuts.length < 2) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % cuts.length);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, cuts.length]);

  const activeCut = cuts[activeIndex];
  const previousSlide = () =>
    setActiveIndex((index) => (index - 1 + cuts.length) % cuts.length);
  const nextSlide = () => setActiveIndex((index) => (index + 1) % cuts.length);

  if (!activeCut) {
    return null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-black/15 bg-secondary-card sm:min-h-[560px]">
        <Image
          key={activeCut.image}
          src={activeCut.image}
          alt={activeCut.title}
          fill
          sizes="(min-width: 1024px) 768px, 100vw"
          className="object-cover transition-opacity duration-300"
        />

        {cuts.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous cut"
              onClick={previousSlide}
              className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md border border-white/15 bg-background/80 text-foreground transition hover:bg-background"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next cut"
              onClick={nextSlide}
              className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md border border-white/15 bg-background/80 text-foreground transition hover:bg-background"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}

      </div>

      <div className="grid grid-cols-2 gap-3">
        {cuts.map((cut, index) => (
          <button
            key={cut.title}
            type="button"
            aria-label={`Show ${cut.title}`}
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={`relative min-h-40 overflow-hidden rounded-lg border transition sm:min-h-52 lg:min-h-0 ${
              index === activeIndex ? "border-gold" : "border-black/15 opacity-65 hover:opacity-100"
            }`}
          >
            <Image src={cut.image} alt="" fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-left text-xs font-semibold text-white">
              {cut.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
