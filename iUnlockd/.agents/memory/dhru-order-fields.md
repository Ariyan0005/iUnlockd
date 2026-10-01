---
name: Dhru dynamic order fields
description: Dhru product field metadata must be preserved exactly for order submission.
---

Treat each merchant field name as an API contract: retain its original casing and spelling when building the Dhru `fields` payload, while using a normalized label only for the customer-facing form. Products without metadata must continue using the legacy manual order fields.

**Why:** Dhru accepts product-specific field values by their exact merchant-provided names, and not every merchant/product exposes field metadata.

**How to apply:** When changing sync, forms, or order submission, keep exact field keys for outbound payloads and preserve the manual fallback path.