import { useEffect } from "react";

export interface SEOOptions {
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  robots?: string;
  jsonLd?: Record<string, unknown>;
}

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

function absoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, window.location.origin).toString();
}

export function useSEO(title: string, description?: string, options: SEOOptions = {}) {
  const jsonLdText = options.jsonLd ? JSON.stringify(options.jsonLd) : "";

  useEffect(() => {
    document.title = title;
    if (description !== undefined) {
      setMeta('meta[name="description"]', { name: "description", content: description });
    }
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    if (description !== undefined) {
      setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    }
    setMeta('meta[property="og:type"]', { property: "og:type", content: options.ogType ?? "website" });

    const canonical = absoluteUrl(options.canonicalUrl ?? window.location.pathname);
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "iUnlockd" });
    setMeta('meta[property="og:image"]', {
      property: "og:image",
      content: absoluteUrl(options.ogImage ?? "/opengraph.jpg"),
    });
    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    if (description !== undefined) {
      setMeta('meta[name="twitter:description"]', {
        name: "twitter:description",
        content: description,
      });
    }
    setMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: absoluteUrl(options.ogImage ?? "/opengraph.jpg"),
    });
    setMeta('meta[name="robots"]', {
      name: "robots",
      content: options.robots ?? "index, follow",
    });

    const existingStructuredData = document.head.querySelector(
      'script[data-seo-jsonld="true"]',
    );
    if (jsonLdText) {
      const structuredData =
        existingStructuredData instanceof HTMLScriptElement
          ? existingStructuredData
          : document.createElement("script");
      structuredData.type = "application/ld+json";
      structuredData.dataset.seoJsonld = "true";
      structuredData.textContent = jsonLdText;
      if (!existingStructuredData) document.head.appendChild(structuredData);
    } else {
      existingStructuredData?.remove();
    }

    let canonicalLink = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;
  }, [
    title,
    description,
    options.canonicalUrl,
    options.ogImage,
    options.ogType,
    options.robots,
    jsonLdText,
  ]);
}
