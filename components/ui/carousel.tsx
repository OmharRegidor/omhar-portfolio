"use client";
import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;
type CarouselPlugin = NonNullable<Parameters<typeof useEmblaCarousel>[1]>;

interface CarouselProps {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  className?: string;
  children?: React.ReactNode;
}

interface CarouselContextValue {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) throw new Error("useCarousel must be used within a <Carousel>");
  return ctx;
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ opts, plugins, className, children, ...props }, ref) => {
    const reduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const [carouselRef, api] = useEmblaCarousel(
      {
        align: "start",
        loop: false,
        ...opts,
        ...(reduceMotion ? { duration: 0 } : {}),
      },
      plugins,
    );

    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((emblaApi: NonNullable<CarouselApi>) => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    }, []);

    React.useEffect(() => {
      if (!api) return;
      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);
      return () => {
        api.off("reInit", onSelect);
        api.off("select", onSelect);
      };
    }, [api, onSelect]);

    const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
    const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

    const onKey = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          scrollPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    return (
      <CarouselContext.Provider value={{ carouselRef, api, scrollPrev, scrollNext, canScrollPrev, canScrollNext }}>
        <div
          ref={ref}
          onKeyDown={onKey}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          tabIndex={0}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef } = useCarousel();
    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div ref={ref} className={cn("flex -ml-4", className)} {...props} />
      </div>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full pl-4", className)}
      {...props}
    />
  ),
);
CarouselItem.displayName = "CarouselItem";

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label"?: string;
}

const CarouselPrevious = React.forwardRef<HTMLButtonElement, NavButtonProps>(
  ({ className, "aria-label": ariaLabel = "Previous", ...props }, ref) => {
    const { scrollPrev, canScrollPrev } = useCarousel();
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        className={cn(
          "absolute -left-4 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center",
          "rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  },
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<HTMLButtonElement, NavButtonProps>(
  ({ className, "aria-label": ariaLabel = "Next", ...props }, ref) => {
    const { scrollNext, canScrollNext } = useCarousel();
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={!canScrollNext}
        onClick={scrollNext}
        className={cn(
          "absolute -right-4 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center",
          "rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  },
);
CarouselNext.displayName = "CarouselNext";

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
export type { CarouselApi };
