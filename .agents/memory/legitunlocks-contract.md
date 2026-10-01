---
name: LegitUnlocks API contract
description: Verified product-list request shape and the limits of current order/status knowledge.
---

LegitUnlocks product listing uses a dedicated request: POST to `/api/reseller/v1/products` with URL-encoded `key`, `username`, and `action=product`. The observed response uses `DHRUFUSION_COMPATIBILITY` XML.

**Why:** The provider's reseller URL and XML response are provider-specific; generic Dhru order/status examples are not evidence that the same contract works here.

**How to apply:** Keep this separate from GSM Africa's `dhru` format (GET `/api/reseller/v1/products` with Bearer auth). Do not enable LegitUnlocks order submission or status polling until its own successful contract is documented or verified.