"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Cut = {
  title: string;
  image: string;
};

export function RecentCutsSlideshow({ cuts }: { cuts: Cut[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (cuts.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % cuts.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [cuts.length]);

  const activeCut = cuts[activeIndex];
  const previousSlide = () =>
    setActiveIndex((index) => (index - 1 + cuts.length) % cuts.length);
  const nextSlide = () => setActiveIndex((index) => (index + 1) % cuts.length);

  if (!activeCut) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-line bg-secondary-card">
      <div className="relative aspect-square w-full">
        <Image
          key={activeCut.image}
          src={activeCut.image}
          alt={activeCut.title}
          fill
          sizes="(min-width: 1024px) 768px, 100vw"
          className="object-contain transition-opacity duration-300"
        />

        {cuts.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous cut"
              onClick={previousSlide}
              className="absolute left-4 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md bg-background/75 text-foreground transition hover:bg-background"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next cut"
              onClick={nextSlide}
              className="absolute right-4 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md bg-background/75 text-foreground transition hover:bg-background"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md bg-background/75 px-2 py-1">
          {cuts.map((cut, index) => (
            <button
              key={cut.title}
              type="button"
              aria-label={`Show ${cut.title}`}
              onClick={() => setActiveIndex(index)}
              className={`size-1.5 rounded-sm ${
                index === activeIndex ? "bg-foreground" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
