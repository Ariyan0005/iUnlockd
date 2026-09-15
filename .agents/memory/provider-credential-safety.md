---
name: Provider credential safety
description: The rule for handling device-check provider keys and database credentials in this project.
---

Provider credentials and database connection strings must stay outside source control. Runtime configuration should read them from environment-backed secrets, while provider records may store keys only through the server-side admin flow.

**Why:** An imported source snapshot contained a hardcoded database credential and non-placeholder environment values; committing those would expose infrastructure access.

**How to apply:** Before committing configuration or provider changes, scan templates and source for real values, keep only safe placeholders in examples, and use the workspace secret/environment flow for live values.