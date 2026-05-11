"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import { recommendations } from "@/content/recommendations";
import { Section } from "./section";

export function RecommendationsCarousel() {
  if (recommendations.length === 0) return null;
  return (
    <Section title="Recommendations" isEmpty={false}>
      <Carousel opts={{ align: "start", loop: false }} aria-label="Client recommendations">
        <CarouselContent>
          {recommendations.map((r, i) => (
            <CarouselItem key={i} className="basis-full">
              <figure className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <blockquote className="text-xs leading-relaxed text-[hsl(var(--foreground))] line-clamp-[10]">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-3 pt-3 border-t border-[hsl(var(--border))] text-xs">
                  <p className="font-semibold text-[hsl(var(--foreground))]">{r.name}</p>
                  <p className="text-[hsl(var(--muted-foreground))]">{r.title}</p>
                </figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className="mt-3" />
      </Carousel>
    </Section>
  );
}
