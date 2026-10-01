---
name: GitHub push authentication
description: The repository can be readable without credentials, but pushing requires a valid GitHub personal access token.
---

Public repository access does not prove that push credentials work. First check whether the workspace already has an authenticated GitHub CLI session and configure Git from it; only then request a replacement through the secure secrets flow. Never place a token in a remote URL or chat.

**Why:** The repository was readable over HTTPS while both configured token values were rejected by GitHub, but the existing authenticated GitHub CLI session still had repository write access.

**How to apply:** Run the GitHub CLI's Git credential setup when an authenticated session exists. If no usable session exists, use the workspace secret without printing its value and stop after authentication fails until the user replaces it with a valid token that has write access.