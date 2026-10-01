"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";

export type CardItem = {
  imgUrl: string;
  alt?: string;
  linkUrl?: string;
};

const maxVisible = 7;
const half = 3;
const fanPositions = [
  { rotation: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rotation: -14, scale: 0.8498, x: -22, y: 4, zIndex: 2 },
  { rotation: -7, scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rotation: 0, scale: 1, x: 0, y: 0, zIndex: 10 },
  { rotation: 7, scale: 0.9346, x: 11, y: 1.3, zIndex: 3 },
  { rotation: 14, scale: 0.8498, x: 22, y: 4, zIndex: 2 },
  { rotation: 21, scale: 0.7756, x: 30, y: 7.3, zIndex: 1 },
];

function getWidthMultiplier(width: number) {
  if (width < 480) return 0.28;
  if (width < 640) return 0.38;
  if (width < 768) return 0.5;
  if (width < 1024) return 0.75;
  return 1;
}

function getHeightMultiplier(width: number) {
  const idealHeight = width < 480 ? 352 : width < 640 ? 416 : width < 768 ? 448 : width < 1024 ? 544 : 608;
  return Math.min(1, (window.innerHeight * 0.7) / idealHeight);
}

function getSlotConfig(totalCards: number, slot: number) {
  if (totalCards >= maxVisible) return fanPositions[slot];
  const center = (totalCards - 1) / 2;
  const distance = totalCards > 1 ? (slot - center) / center : 0;
  const absoluteDistance = Math.abs(distance);
  return {
    rotation: distance * 16,
    scale: 1 - 0.14 * absoluteDistance * absoluteDistance,
    x: distance * 18,
    y: absoluteDistance * absoluteDistance * 3.5,
    zIndex: 10 - Math.abs(slot - center),
  };
}

export default function CardFanCarousel({ cards }: { cards: CardItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const previousVisible = useRef<Set<number>>(new Set());
  const needsPagination = cards.length > maxVisible;
  const [centerIndex, setCenterIndex] = useState(needsPagination ? half : cards.length >> 1);

  const getVisibleMap = useCallback((center: number) => {
    const map = new Map<number, number>();
    if (!needsPagination) {
      cards.forEach((_, index) => map.set(index, index));
      return map;
    }

    for (let slot = 0; slot < maxVisible; slot += 1) {
      map.set(((center + slot - half) % cards.length + cards.length) % cards.length, slot);
    }
    return map;
  }, [cards, needsPagination]);

  const cycle = useCallback((direction: "left" | "right") => {
    if (isAnimating.current || !needsPagination) return;
    isAnimating.current = true;
    directionRef.current = direction;
    setCenterIndex((index) => direction === "right"
      ? (index + 1) % cards.length
      : (index - 1 + cards.length) % cards.length);
  }, [cards.length, needsPagination]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !cards.length) return;

    const elements = Array.from(container.querySelectorAll<HTMLElement>(".fan-card"));
    const visibleMap = getVisibleMap(centerIndex);
    const prior = previousVisible.current;
    const direction = directionRef.current;
    const firstMount = !hasEntered.current;
    const widthMultiplier = getWidthMultiplier(window.innerWidth);
    const heightMultiplier = getHeightMultiplier(window.innerWidth);
    const slotCount = needsPagination ? maxVisible : cards.length;
    const config = (slot: number) => getSlotConfig(slotCount, slot);
    let completed = 0;

    if (firstMount) isAnimating.current = true;
    const finish = () => {
      completed += 1;
      if (completed >= visibleMap.size) {
        isAnimating.current = false;
        hasEntered.current = true;
      }
    };

    elements.forEach((element, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = prior.has(cardIndex);

      if (slot !== undefined) {
        const position = config(slot);
        const target = {
          x: `${position.x * widthMultiplier}rem`,
          y: `${position.y * heightMultiplier}rem`,
          rotation: position.rotation,
          scale: position.scale,
          opacity: 1,
          zIndex: position.zIndex,
        };

        if (firstMount) {
          gsap.set(element, { x: 0, y: `${12 * heightMultiplier}rem`, rotation: 0, scale: 0.5, opacity: 0 });
          gsap.to(element, { ...target, duration: 1.2, ease: "elastic.out(1.05,.78)", delay: 0.2 + slot * 0.06, onComplete: finish });
        } else if (!wasVisible) {
          gsap.set(element, { x: direction === "right" ? "40rem" : "-40rem", rotation: direction === "right" ? 30 : -30, scale: 0.5, opacity: 0 });
          gsap.to(element, { ...target, duration: 0.6, ease: "power2.out", onComplete: finish });
        } else {
          gsap.to(element, { ...target, duration: 0.5, ease: "power2.out", onComplete: finish });
        }
      } else if (wasVisible) {
        gsap.to(element, { x: direction === "right" ? "-40rem" : "40rem", opacity: 0, scale: 0.5, duration: 0.4, ease: "power2.in" });
      }
    });

    previousVisible.current = new Set(visibleMap.keys());

    const visibleElements = elements.flatMap((element, index) => {
      const slot = visibleMap.get(index);
      return slot === undefined ? [] : [{ element, slot }];
    }).sort((a, b) => a.slot - b.slot);
    const centerSlot = visibleElements.length >> 1;

    const updateHover = (hoveredSlot: number | null) => {
      const width = getWidthMultiplier(window.innerWidth);
      const height = getHeightMultiplier(window.innerWidth);
      visibleElements.forEach(({ element, slot }) => {
        const base = config(slot);
        const distance = hoveredSlot === null ? 0 : Math.abs(slot - hoveredSlot);
        let x = base.x * width;
        let y = base.y * height;
        let rotation = base.rotation;
        let scale = base.scale;

        if (hoveredSlot !== null) {
          if (slot === hoveredSlot) {
            y -= 1.5 * height;
            scale *= 1.08;
          } else {
            const push = 4 * (1 - Math.abs((slot - centerSlot) / Math.max(1, centerSlot)));
            x += (slot < hoveredSlot ? -push : push) * width;
            rotation += (slot < hoveredSlot ? -3 : 3) / (distance + 1);
          }
        }

        gsap.to(element, {
          x: `${x}rem`,
          y: `${y}rem`,
          rotation,
          scale,
          zIndex: slot === hoveredSlot ? 20 : base.zIndex,
          duration: 0.5,
          ease: "elastic.out(1,.75)",
          overwrite: "auto",
        });
      });
    };

    const handlers = visibleElements.map(({ element, slot }) => {
      const handler = () => {
        if (!isAnimating.current) updateHover(slot);
      };
      element.addEventListener("mouseenter", handler);
      return { element, handler };
    });
    const resetHover = () => updateHover(null);
    const resize = () => updateHover(null);
    container.addEventListener("mouseleave", resetHover);
    window.addEventListener("resize", resize);

    return () => {
      handlers.forEach(({ element, handler }) => element.removeEventListener("mouseenter", handler));
      container.removeEventListener("mouseleave", resetHover);
      window.removeEventListener("resize", resize);
      gsap.killTweensOf(elements);
    };
  }, [cards, centerIndex, getVisibleMap, needsPagination]);

  if (!cards.length) return null;

  return (
    <section className="relative z-20 flex w-full flex-col items-center overflow-hidden px-4 py-4 lg:py-8">
      <div className="relative flex min-h-[23rem] w-full max-w-[80rem] items-start justify-center sm:min-h-[30rem] lg:min-h-[39rem]" ref={containerRef}>
        {cards.map((card, index) => {
          const image = (
            <Image
              src={card.imgUrl}
              alt={card.alt ?? `Gallery image ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 288px, (min-width: 640px) 208px, 160px"
              className="object-cover"
            />
          );
          const classes = "fan-card absolute aspect-[3/4] w-40 origin-bottom overflow-hidden rounded-lg border border-black/20 bg-black opacity-0 shadow-2xl sm:w-52 md:w-60 lg:w-72";

          return card.linkUrl ? (
            <a key={card.imgUrl} href={card.linkUrl} className={classes}>{image}</a>
          ) : (
            <div key={card.imgUrl} className={classes}>{image}</div>
          );
        })}
      </div>

      {needsPagination ? (
        <div className="z-30 mt-4 flex items-center justify-center gap-4">
          <button type="button" onClick={() => cycle("left")} aria-label="Previous gallery image" className="grid size-11 place-items-center rounded-full border border-black/15 bg-black/5 text-black/60 transition hover:border-black/30 hover:text-black">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2" aria-hidden="true">
            {cards.map((card, index) => <span key={card.imgUrl} className={`size-2 rounded-full ${index === centerIndex ? "bg-black/70" : "bg-black/15"}`} />)}
          </div>
          <button type="button" onClick={() => cycle("right")} aria-label="Next gallery image" className="grid size-11 place-items-center rounded-full border border-black/15 bg-black/5 text-black/60 transition hover:border-black/30 hover:text-black">
            <ChevronRight size={20} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
