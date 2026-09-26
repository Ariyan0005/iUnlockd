---
name: Provider field schemas
description: Durable rule for mapping merchant product input metadata into customer forms and provider orders.
---

Merchant-provided product field metadata is authoritative. If metadata exists, do not add a legacy IMEI field just because the product category looks device-related. Normalize labels and control types for the customer form, but preserve each provider field name and casing in the outbound order payload.

**Why:** Digital products can require usernames, serials, email addresses, selections, quantities, or no input at all. A forced IMEI fallback makes valid provider services impossible to order.

**How to apply:** Extend the provider alias parser when new response shapes appear, and only use legacy identifier behavior when the provider supplied no field metadata.