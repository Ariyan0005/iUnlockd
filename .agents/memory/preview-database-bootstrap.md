---
name: Preview database bootstrap
description: The imported iUnlockd workspace can start with an empty development database even when the schema is present in code.
---

The development database may need the Drizzle schema pushed before API preview routes can be verified after importing the repository.

**Why:** A clean preview environment can have no application tables yet, causing otherwise valid API routes to return relation-not-found errors.

**How to apply:** When a fresh workspace reports a missing application table during local verification, apply the development schema with the repository's documented DB push command. Do not target production as part of preview setup.