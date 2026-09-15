---
name: Provider diagnostics
description: Durable rules for diagnosing configurable external API providers safely.
---

External API status codes are not enough to validate a provider. A provider can return HTTP 200 with an HTML dashboard, a Cloudflare challenge, or invalid JSON, and those responses must be surfaced as integration failures when the configured contract expects JSON.

**Why:** The IMEI provider failure was hidden by a generic HTTP 502 message, while endpoint and anti-bot responses were the likely root cause.

**How to apply:** Return a bounded body preview, content type, parsed-body state, latency, selected response metadata, and a classified issue from admin tests. Never include API-key values in URLs, bodies, logs, or UI diagnostics.

For configurable providers, an explicitly blank response-format setting means the provider expects no format field; do not replace it with a default during request construction.

**Why:** DeviceDecoded accepts the IMEI JSON body and API-key header but can fail when an extra `format=json` field is injected.

**How to apply:** Use the legacy JSON default only when the setting is absent, while preserving an intentionally empty value through the admin save and request paths.