"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

  if (!activeCut) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-secondary-card">
      <div className="relative min-h-[340px] sm:min-h-[440px]">
        <Image
          key={activeCut.image}
          src={activeCut.image}
          alt={activeCut.title}
          fill
          sizes="(min-width: 1024px) 960px, 100vw"
          className="object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-x-0 bottom-0 border-t border-line bg-background/90 p-4">
          <p className="text-sm font-semibold text-gold">{activeCut.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-surface p-3">
        {cuts.map((cut, index) => (
          <button
            key={cut.title}
            type="button"
            aria-label={`Show ${cut.title}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2 flex-1 rounded-sm ${
              index === activeIndex ? "bg-gold" : "bg-secondary-card"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
