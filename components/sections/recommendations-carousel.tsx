"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { recommendations } from "@/content/recommendations";
import { Section } from "./section";
import { Quote } from "lucide-react";

export function RecommendationsCarousel() {
  // Hard hide — never dev-hint a recs section (low signal, brand-damaging if visible).
  if (recommendations.length === 0) return null;
  return (
    <Section title="Recommendations" isEmpty={false}>
      <Carousel opts={{ align: "start", loop: false }}>
        <CarouselContent>
          {recommendations.map((r, i) => (
            <CarouselItem key={i} className="basis-full md:basis-1/2">
              <figure className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <Quote className="h-5 w-5 text-[hsl(var(--accent))] mb-3" aria-hidden />
                <blockquote className="italic text-[hsl(var(--foreground))]">{r.quote}</blockquote>
                <figcaption className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="font-semibold text-[hsl(var(--foreground))]">{r.name}</span> · {r.title}
                </figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Previous recommendation" />
        <CarouselNext aria-label="Next recommendation" />
      </Carousel>
    </Section>
  );
}
