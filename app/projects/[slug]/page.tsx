import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { MdxFrontmatterSchema } from "@/content/schemas";
import { BackToHome } from "@/components/layout/back-to-home";

export function generateStaticParams() {
  const dir = join(process.cwd(), "content", "projects");
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => ({ slug: f.replace(/\.mdx$/, "") }));
  } catch {
    return [];
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const file = join(process.cwd(), "content", "projects", `${slug}.mdx`);
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    notFound();
  }
  const parsed = matter(raw);
  let fm: ReturnType<typeof MdxFrontmatterSchema.parse>;
  try {
    fm = MdxFrontmatterSchema.parse(parsed.data);
  } catch {
    notFound();
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
      <BackToHome />
      <h1 className="text-[length:var(--text-display)] font-bold">{fm.title}</h1>
      <div>{content}</div>
    </article>
  );
}
