---
name: Artifact preview paths
description: Durable guidance for projects containing multiple imported web artifacts.
---

Only one web artifact should claim the root preview path. Secondary imported apps need their own preview path and matching base path/service routing, otherwise screenshots and proxy requests can resolve to the wrong app or fail.

**Why:** Importing the source added two web artifacts at `/`, making the intended app preview ambiguous until the secondary app moved to `/pm`.

**How to apply:** Check registered artifact preview paths after importing a repository and assign unique paths before relying on screenshots or deploy previews. A repo cloned into a nested directory can also start successfully on its local port while the shared proxy still returns “Backend Not Configured”; verify forwarding separately before declaring the preview healthy. Also confirm the active API artifact points at the cloned app’s routes and schema, not an empty root scaffold.