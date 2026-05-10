import Image from "next/image";
import Link from "next/link";
import { profile } from "@/content/profile";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { FeaturedAward } from "./featured-award";

export function ProfileCard() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-6">
        <Image
          src={profile.photoSrc}
          alt={`Profile photo of ${profile.name}`}
          width={160}
          height={160}
          priority
          className="rounded-xl object-cover"
        />
        <div className="flex flex-col gap-3">
          <h1 className="text-[length:var(--text-display)] font-bold tracking-tight">
            {profile.name}
          </h1>
          <p className="inline-flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
            <MapPin className="h-4 w-4" aria-hidden />
            {profile.location}
          </p>
          <p className="text-[hsl(var(--foreground))]">{profile.role}</p>
          {profile.featuredAwards.length > 0 && (
            <FeaturedAward awards={profile.featuredAwards} />
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild>
              <Link
                href={profile.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
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
