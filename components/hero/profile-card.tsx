import Image from "next/image";
import Link from "next/link";
import { profile } from "@/content/profile";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { Calendar, MapPin, BadgeCheck } from "lucide-react";
import { FeaturedAward } from "./featured-award";

export function ProfileCard() {
  return (
    <div className="relative rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8">
      {/* Theme switch lives top-right of the hero card (matches reference) */}
      <ThemeSwitch className="absolute right-4 top-4 sm:right-6 sm:top-6" />

      <div className="flex flex-col sm:flex-row gap-6">
        <Image
          src={profile.photoSrc}
          alt={`Profile photo of ${profile.name}`}
          width={160}
          height={160}
          priority
          className="w-40 h-40 rounded-xl object-cover object-top shrink-0"
        />
        <div className="flex flex-col gap-3 min-w-0">
          <h1 className="inline-flex items-center gap-2 text-lg md:text-2xl font-bold tracking-tight">
            <span className="truncate">{profile.name}</span>
            <BadgeCheck
              className="h-5 w-5 fill-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shrink-0"
              aria-label="Verified"
            />
          </h1>
          <p className="inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
            <MapPin className="h-4 w-4" aria-hidden />
            {profile.location}
          </p>
          <p className="text-sm text-[hsl(var(--foreground))]">{profile.role}</p>
          {profile.featuredAwards.length > 0 && (
            <FeaturedAward awards={profile.featuredAwards} />
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={profile.calendlyUrl} target="_blank" rel="noopener noreferrer">
                <Calendar className="mr-2 h-4 w-4" aria-hidden />
                Schedule a Call
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
