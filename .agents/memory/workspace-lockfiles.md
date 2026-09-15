---
name: Workspace lockfiles
description: Deployment reliability rule for pnpm workspace dependency manifests
---

When adding or restoring a workspace package, regenerate `pnpm-lock.yaml` before relying on `pnpm install --frozen-lockfile` in deployment.

**Why:** A package can typecheck locally while the VPS deploy fails before building because pnpm validates every workspace manifest against the lockfile.

**How to apply:** After package-manifest changes, run a lockfile-only install, then validate with a frozen install before handing off deployment work.