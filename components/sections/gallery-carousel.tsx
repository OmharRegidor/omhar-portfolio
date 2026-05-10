"use client";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { gallery } from "@/content/gallery";
import { Section } from "./section";
import { ImageOff } from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

export function GalleryCarousel() {
  if (gallery.length === 0) {
    if (!isDev) return null;
    return (
      <Section
        title="Gallery"
        isEmpty
        emptyIcon={<ImageOff className="h-6 w-6" />}
        emptyHint={{
          title: "Gallery empty",
          hint: "Drop images in /public/gallery/ and add entries to content/gallery.ts.",
        }}
      >
        {null}
      </Section>
    );
  }
  return (
    <Section title="Gallery" isEmpty={false}>
      <Carousel opts={{ align: "start", loop: false }}>
        <CarouselContent>
          {gallery.map((img) => (
            <CarouselItem key={img.src} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Previous image" />
        <CarouselNext aria-label="Next image" />
      </Carousel>
    </Section>
  );
}
