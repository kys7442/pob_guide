import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { guides, getGuideBySlug } from "@/content/guides";
import AdSense from "@/components/AdSense";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://poe-build.guide";

  return {
    title: guide.title,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      authors: [guide.author],
      url: `${baseUrl}/guides/${guide.slug}`,
    },
  };
}

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listOrdered = false;

  function flushList() {
    if (listItems.length > 0) {
      if (listOrdered) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="text-sm text-gray-300 leading-relaxed space-y-1.5 pl-5 list-decimal">
            {listItems.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="text-sm text-gray-300 leading-relaxed space-y-1.5 pl-5 list-disc">
            {listItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-lg font-bold text-white mt-8 mb-3">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-base font-bold text-gray-200 mt-6 mb-2">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("- **") || trimmed.startsWith("- ")) {
      if (!inList || listOrdered) {
        flushList();
        inList = true;
        listOrdered = false;
      }
      listItems.push(renderInline(trimmed.slice(2)));
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || !listOrdered) {
        flushList();
        inList = true;
        listOrdered = true;
      }
      listItems.push(renderInline(trimmed.replace(/^\d+\.\s/, "")));
    } else {
      flushList();
      elements.push(
        <p key={`p-${elements.length}`} className="text-sm text-gray-300 leading-relaxed">
          {renderInlineJSX(trimmed)}
        </p>
      );
    }
  }
  flushList();
  return elements;
}

function renderInline(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1");
}

function renderInlineJSX(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://poe-build.guide";
  const contentParts = guide.content.split("\n\n");
  const midIndex = Math.floor(contentParts.length / 2);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.description,
            author: {
              "@type": "Organization",
              name: guide.author,
            },
            datePublished: guide.publishedAt,
            dateModified: guide.updatedAt,
            publisher: {
              "@type": "Organization",
              name: "PoE 빌드 가이드",
              url: baseUrl,
            },
            mainEntityOfPage: `${baseUrl}/guides/${guide.slug}`,
          }),
        }}
      />
      <article className="max-w-3xl mx-auto">
        {/* 브레드크럼 */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-amber-400 transition-colors">홈</a>
          <span>/</span>
          <a href="/guides" className="hover:text-amber-400 transition-colors">가이드</a>
          <span>/</span>
          <span className="text-gray-400">{guide.title}</span>
        </nav>

        {/* 헤더 */}
        <header className="mb-8">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 mb-3">
            {guide.categoryLabel}
          </span>
          <h1 className="text-2xl font-black text-white mb-3">{guide.title}</h1>
          <p className="text-sm text-gray-400 mb-3">{guide.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>작성: {guide.author}</span>
            <span>·</span>
            <span>게시: {guide.publishedAt}</span>
            <span>·</span>
            <span>수정: {guide.updatedAt}</span>
          </div>
        </header>

        {/* 본문 전반부 */}
        <div className="space-y-4">
          {renderContent(contentParts.slice(0, midIndex).join("\n\n"))}
        </div>

        {/* 중간 AdSense */}
        <div className="my-8">
          <AdSense adSlot="1234567892" />
        </div>

        {/* 본문 후반부 */}
        <div className="space-y-4">
          {renderContent(contentParts.slice(midIndex).join("\n\n"))}
        </div>

        {/* 관련 가이드 */}
        <section className="mt-12 pt-8 border-t border-gray-800">
          <h2 className="text-base font-bold text-white mb-4">관련 가이드</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guides
              .filter((g) => g.slug !== guide.slug)
              .slice(0, 4)
              .map((g) => (
                <a
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-amber-600 transition-colors group"
                >
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 mb-2">
                    {g.categoryLabel}
                  </span>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    {g.title}
                  </h3>
                </a>
              ))}
          </div>
        </section>

        {/* 하단 AdSense */}
        <div className="mt-8">
          <AdSense adSlot="1234567893" />
        </div>
      </article>
    </>
  );
}
