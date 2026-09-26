---
name: Public service identifiers
description: Durable rule for customer-facing service URLs and provider ID visibility.
---

Customer-facing service responses and links should use a stable slug. Provider API IDs remain stored with the service and are resolved server-side for synchronization and order forwarding; legacy numeric lookup can remain for compatibility but should not be used for new links.

**Why:** Slugs are readable and SEO-friendly, while exposing provider identifiers couples the public site to a merchant API contract.

**How to apply:** Generate a unique slug when importing or creating a product, keep it stable after assignment, accept service slugs in customer order requests, and omit provider API IDs from public serializers.