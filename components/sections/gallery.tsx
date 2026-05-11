import Image from "next/image";
import { gallery } from "@/content/gallery";
import { Section } from "./section";
import { ImageOff } from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

export function Gallery() {
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
  return (
    <Section title="Gallery" isEmpty={false}>
      <div className="grid grid-cols-2 gap-4">
        {gallery.map((img) => (
          <div
            key={img.src}
            className="relative aspect-square overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(min-width: 768px) 400px, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
