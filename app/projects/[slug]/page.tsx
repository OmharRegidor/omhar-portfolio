import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { MdxFrontmatterSchema } from "@/content/schemas";
import { BackToHome } from "@/components/layout/back-to-home";
import { projects } from "@/content/projects";

// Slug list comes from the projects array (statically imported), NOT from fs.readdirSync.
// Vercel's build environment doesn't reliably resolve fs.readdirSync at SSG time, so we
// trust projects.ts as the source of truth for which slugs have case studies.
export function generateStaticParams() {
  return projects.filter((p) => p.caseStudy).map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false; // any slug not in generateStaticParams returns 404

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const file = join(process.cwd(), "content", "projects", `${slug}.mdx`);
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return notFound();
  }
  const parsed = matter(raw);
  let fm: ReturnType<typeof MdxFrontmatterSchema.parse>;
  try {
    fm = MdxFrontmatterSchema.parse(parsed.data);
  } catch {
    return notFound();
  }
  const { content } = await compileMDX({
    source: parsed.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        format: "mdx",
        rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
      },
    },
  });
  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <BackToHome />
        <h1 className="text-2xl font-bold">{fm.title}</h1>
      </div>
      <div className="text-sm leading-relaxed">{content}</div>
    </article>
  );
}
