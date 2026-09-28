---
name: Provider credential safety
description: The rule for handling device-check provider keys and database credentials in this project.
---

Provider credentials and database connection strings must stay outside source control. Runtime configuration should read them from environment-backed secrets, while provider records may store keys only through the server-side admin flow.

**Why:** An imported source snapshot contained a hardcoded database credential and non-placeholder environment values; committing those would expose infrastructure access.

**How to apply:** Before committing configuration or provider changes, scan templates and source for real values, keep only safe placeholders in examples, and use the workspace secret/environment flow for live values.

Provider endpoints and credentials should use unbounded text columns rather than arbitrary fixed-length varchar limits.

**Why:** A production schema sync failed while narrowing an existing provider value to varchar(500), blocking all later provider configuration changes.

**How to apply:** Keep endpoint/key storage flexible; validate request shape and access in the server/admin flow instead of truncating or narrowing stored provider values.