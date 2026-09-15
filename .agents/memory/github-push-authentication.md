---
name: GitHub push authentication
description: The repository can be readable without credentials, but pushing requires a valid GitHub personal access token.
---

Public repository access does not prove that push credentials work. Treat a failed authenticated fetch or push as a credential problem, keep the local commit intact, and request replacement through the secure secrets flow rather than placing a token in a remote URL or chat.

**Why:** The repository was readable over HTTPS while both configured token values were rejected by GitHub, so continuing to retry would not resolve the underlying access issue.

**How to apply:** Use the workspace secret for authenticated Git operations, never print its value, and stop after authentication fails until the user replaces it with a valid token that has write access to the repository.