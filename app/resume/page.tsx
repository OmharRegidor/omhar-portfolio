import type { Metadata } from "next";
import Image from "next/image";
import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { projects } from "@/content/projects";
import { techStack } from "@/content/tech-stack";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: `Resume — ${profile.name}`,
  description: `Resume for ${profile.name}, ${profile.role.replace(/\\/g, "/")}.`,
};

export default function ResumePage() {
  const summary = profile.bioParagraphs[0] ?? "";

  return (
    <>
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          html, body { background: #fff !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: none !important; }
          .resume-screen-only { display: none !important; }
          .resume-doc { box-shadow: none !important; border: 0 !important; padding: 0 !important; max-width: none !important; }
          .resume-doc a { color: #000 !important; text-decoration: none !important; }
        }
      `}</style>

      <div className="resume-screen-only mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Resume</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Generated live from portfolio data. Click below, then pick &ldquo;Save as PDF&rdquo; as the destination.
          </p>
        </div>
        <PrintButton />
      </div>

      <article className="resume-doc mx-auto max-w-[8.5in] rounded-sm border border-gray-200 bg-white px-10 py-10 text-black shadow-sm">
        <header className="flex items-start justify-between gap-6 border-b border-gray-300 pb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{profile.name}</h1>
            <p className="mt-1 text-sm text-gray-800">{profile.role}</p>
            <p className="mt-1 text-xs text-gray-600">{profile.location}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="underline">
                  {profile.email}
                </a>
              )}
              {profile.phone && <span>{profile.phone}</span>}
              {profile.socials.map((s) => (
                <a key={s.label} href={s.url} className="underline">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <Image
            src={profile.photoSrc}
            alt={profile.name}
            width={96}
            height={96}
            className="h-24 w-24 shrink-0 rounded-sm object-cover object-top"
          />
        </header>

        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">Summary</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-800">{summary}</p>
        </section>

        <section className="mt-4 border-t-2 border-black pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">Selected Projects</h2>
          <ul className="mt-1 space-y-2">
            {projects.map((p) => (
              <li key={p.slug} className="text-xs text-gray-800">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <a href={p.url} className="text-gray-700 underline">
                    {new URL(p.url).hostname.replace(/^www\./, "")}
                  </a>
                </div>
                <p className="text-gray-700">{p.blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 border-t-2 border-black pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">Tech Stack</h2>
          <ul className="mt-1 space-y-1">
            {Object.entries(techStack).map(([cat, items]) => (
              <li key={cat} className="text-xs text-gray-800">
                <span className="font-semibold">{cat}:</span>{" "}
                <span className="text-gray-700">{items.join(" · ")}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 border-t-2 border-black pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">Experience &amp; Education</h2>
          <ul className="mt-1 space-y-2">
            {experience.map((e) => (
              <li key={`${e.year}-${e.title}`} className="text-xs text-gray-800">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{e.title}</span>
                  <span className="text-gray-600 tabular-nums">{e.year}</span>
                </div>
                <p className="text-gray-700">{e.org}</p>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
