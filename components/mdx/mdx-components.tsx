import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes } from "react";

const Anchor = ({ href, title, children }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isExternal = !!href && /^https?:\/\//.test(href);
  if (isExternal) {
    return (
      <a
        href={href}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[hsl(var(--accent))] underline"
      >
        {children}
      </a>
    );
  }
  return (
    <a href={href} title={title} className="text-[hsl(var(--accent))] underline">
      {children}
    </a>
  );
};

export const mdxComponents: MDXComponents = {
  h1: (p) => <h1 className="text-[length:var(--text-display)] font-bold mt-8 mb-4" {...p} />,
  h2: (p) => <h2 className="text-[length:var(--text-h2)] font-bold mt-8 mb-3" {...p} />,
  h3: (p) => <h3 className="text-[length:var(--text-h3)] font-semibold mt-6 mb-2" {...p} />,
  p: (p) => <p className="my-4 text-[hsl(var(--foreground))]" {...p} />,
  pre: (p) => <pre className="my-6 overflow-x-auto rounded-xl bg-[hsl(var(--muted))] p-4 text-sm" {...p} />,
  code: (p) => <code className="rounded bg-[hsl(var(--muted))] px-1 py-0.5 text-sm" {...p} />,
  a: Anchor,
};
