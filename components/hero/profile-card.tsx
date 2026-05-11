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
      {/* Theme switch top-right */}
      <ThemeSwitch className="absolute right-4 top-4 sm:right-6 sm:top-6" />

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Profile photo stack — 4 images layered with opacity transitions.
            Light/dark variants via dark: variant; hover variants via group-hover.
            Only one image is visible at a time; transitions are 500ms. */}
        <div className="group relative w-40 h-40 shrink-0">
          {/* Light mode — default */}
          <Image
            src="/omhar/profile-light-1.png"
            alt={`Profile photo of ${profile.name}`}
            width={160}
            height={160}
            priority
            className="absolute inset-0 h-full w-full rounded-xl object-cover object-top transition-opacity duration-500 opacity-100 group-hover:opacity-0 dark:opacity-0"
          />
          {/* Light mode — hover */}
          <Image
            src="/omhar/profile-light-shy.png"
            alt=""
            aria-hidden
            width={160}
            height={160}
            className="absolute inset-0 h-full w-full rounded-xl object-cover object-top transition-opacity duration-500 opacity-0 group-hover:opacity-100 dark:opacity-0 dark:group-hover:opacity-0"
          />
          {/* Dark mode — default */}
          <Image
            src="/omhar/profile-dark-1.png"
            alt=""
            aria-hidden
            width={160}
            height={160}
            priority
            className="absolute inset-0 h-full w-full rounded-xl object-cover object-top transition-opacity duration-500 opacity-0 dark:opacity-100 group-hover:opacity-0 dark:group-hover:opacity-0"
          />
          {/* Dark mode — hover */}
          <Image
            src="/omhar/profile-dark-shy.png"
            alt=""
            aria-hidden
            width={160}
            height={160}
            className="absolute inset-0 h-full w-full rounded-xl object-cover object-top transition-opacity duration-500 opacity-0 dark:group-hover:opacity-100"
          />
        </div>

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
