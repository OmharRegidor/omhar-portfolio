import matter from "gray-matter";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { MdxFrontmatterSchema } from "@/content/schemas";
import { BackToHome } from "@/components/layout/back-to-home";
import { caseStudies } from "@/content/case-studies";

// Slug list comes from the case-studies manifest, NOT fs. Reason:
// Next.js 16's SSG worker on Vercel runs from a different process.cwd()
// than the build process, so fs.readFileSync silently fails and pages
// pre-render as 404. The manifest is webpack-bundled, available everywhere.
export function generateStaticParams() {
  return Object.keys(caseStudies).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = caseStudies[slug];
  if (!raw) return notFound();

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
