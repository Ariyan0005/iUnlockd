import { useEffect } from "react";

export interface SEOOptions {
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
}

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

export function useSEO(title: string, description?: string, options: SEOOptions = {}) {
  useEffect(() => {
    document.title = title;
    if (description) setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    if (description) setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:type"]', { property: "og:type", content: options.ogType ?? "website" });
    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "iUnlockd" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    if (description) setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });

    const canonical = new URL(options.canonicalUrl ?? window.location.pathname, window.location.origin).toString();
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    const ogImage = options.ogImage ?? `${window.location.origin}/opengraph.jpg`;
    setMeta('meta[property="og:image"]', { property: "og:image", content: ogImage });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });

    let canonicalLink = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;
  }, [title, description, options.canonicalUrl, options.ogImage, options.ogType]);
}
