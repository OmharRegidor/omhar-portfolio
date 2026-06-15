"use client";
import * as React from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X, ImageOff } from "lucide-react";
import { gallery } from "@/content/gallery";
import type { GalleryImage } from "@/content/schemas";
import { Section } from "./section";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
} from "@/components/ui/carousel";

const isDev = process.env.NODE_ENV === "development";

export function Gallery() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const next = React.useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % gallery.length));
  }, []);
  const prev = React.useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
  }, []);

  React.useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, next, prev]);

  if (gallery.length === 0) {
    if (!isDev) return null;
    return (
      <Section
        title="Gallery"
        isEmpty
        emptyIcon={<ImageOff className="h-6 w-6" />}
        emptyHint={{
          title: "Gallery empty",
          hint: "Drop images in /public/omhar/gallery/ and add entries to content/gallery.ts.",
        }}
      >
        {null}
      </Section>
    );
  }

  const current = openIndex !== null ? (gallery[openIndex] ?? null) : null;
  const open = openIndex !== null;

  const renderThumb = (img: GalleryImage, i: number) => (
    <button
      type="button"
      onClick={() => setOpenIndex(i)}
      aria-label={`View ${img.alt} (image ${i + 1} of ${gallery.length})`}
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]"
    >
      <Image
        src={img.src}
        alt={img.alt}
        fill
        sizes="(min-width: 768px) 400px, 100vw"
        className="object-cover motion-safe:transition-transform duration-300 ease-out motion-safe:group-hover:scale-105"
      />
    </button>
  );

  return (
    <Section title="Gallery" isEmpty={false}>
      {/* Mobile: single-image carousel with dots above and on-image arrows */}
      <div className="md:hidden">
        <Carousel opts={{ align: "start", loop: false }} aria-label="Gallery images">
          <CarouselDots className="mb-2" />
          <div className="relative">
            <CarouselContent className="ml-0">
              {gallery.map((img, i) => (
                <CarouselItem key={img.src} className="pl-0">
                  {renderThumb(img, i)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </div>
        </Carousel>
      </div>

      {/* Tablet / Desktop: 2x2 grid */}
      <div className="hidden md:grid grid-cols-2 gap-4">
        {gallery.map((img, i) => (
          <React.Fragment key={img.src}>{renderThumb(img, i)}</React.Fragment>
        ))}
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:motion-safe:animate-in data-[state=closed]:motion-safe:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none focus-visible:outline-none"
          >
            <DialogPrimitive.Title className="sr-only">
              {current?.alt ?? "Gallery image"}
            </DialogPrimitive.Title>

            <div className="pointer-events-auto absolute left-4 top-4 text-sm text-white/80 tabular-nums">
              {openIndex !== null && `${openIndex + 1} / ${gallery.length}`}
            </div>

            <DialogPrimitive.Close
              className="pointer-events-auto absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-white/80 motion-safe:transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>

            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-md text-white/80 motion-safe:transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-md text-white/80 motion-safe:transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {current && (
              <div className="pointer-events-auto relative h-[85vh] w-[90vw]">
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="90vw"
                  priority
                  className="object-contain"
                />
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </Section>
  );
}
