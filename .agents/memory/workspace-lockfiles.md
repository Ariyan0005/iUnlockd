---
name: Workspace lockfiles
description: Deployment reliability rule for pnpm workspace dependency manifests
---

When adding or restoring a workspace package, regenerate `pnpm-lock.yaml` before relying on `pnpm install --frozen-lockfile` in deployment.

**Why:** A package can typecheck locally while the VPS deploy fails before building because pnpm validates every workspace manifest against the lockfile.

**How to apply:** After package-manifest changes, run a lockfile-only install, then validate with a frozen install before handing off deployment work.

Production schema sync should run as part of API deployment, with normal Drizzle push as the default and force mode explicitly opt-in.

**Why:** Skipping schema sync leaves new API tables unavailable, while unconditional force mode can apply destructive schema changes without review.

**How to apply:** Keep the deploy script's normal path confirmation-aware; use the force override only after a database backup and an intentional review of the generated change.

When a Replit package-install helper targets the workspace root and pnpm rejects an implicit root dependency, add the dependency to its owning package with a package-filtered pnpm command.

**Why:** Workspace runtime dependencies belong to the package that imports them, and an unfiltered root install either fails or records the dependency in the wrong manifest.

**How to apply:** Use the exact workspace package name with `pnpm --filter @workspace/<package> add <dependency>`, then verify the lockfile with a frozen install.