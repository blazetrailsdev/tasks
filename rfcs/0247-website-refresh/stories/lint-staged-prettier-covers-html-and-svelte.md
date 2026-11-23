---
title: "lint-staged runs prettier on .html and .svelte, matching CI's Prettier step"
status: draft
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`.lintstagedrc.mjs` runs `prettier --write` only on `*.{js,jsx,mjs,cjs,ts,tsx}` and `*.{json,md,yml,yaml,css,scss}`. Preflight's Prettier step (`.github/workflows/ci.yml`) checks every file Prettier handles, `.html` and `.svelte` included. So an unformatted `packages/website/src/app.html` passed the pre-commit hook and redded Preflight on trails#10615. Preflight then self-cancelled the run, so every job read "cancelled" and the cause showed only in the job annotations.

## Acceptance criteria

- `.lintstagedrc.mjs` runs `prettier --write` on every extension the CI Prettier step checks: at least `html` and `svelte`, plus any others that step covers (read ci.yml's Prettier step to get the list).
- Committing an unformatted `.html` file through the hook leaves it formatted, and `prettier --check` on it passes.
