---
title: "lint-staged pre-commit hook does not format eslint/*.mjs rule files"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-06-21T01:59:26Z"
assignee: "lint-staged-format-eslint-mjs"
blocked-by: null
---

## Context

While landing the `no-standalone-associations` ESLint rule (PR #3544), the
authored rule files `eslint/no-standalone-associations.mjs` and
`eslint/no-standalone-associations.test.mjs` shipped un-prettier-formatted and
failed the `Prettier` CI job. The local pre-commit hook reported
"lint-staged could not find any staged files matching configured tasks" on
every commit — i.e. the `.lintstagedrc.mjs` glob set does **not** cover
`eslint/*.mjs` (the directory holding all custom ESLint rules + their tests),
so formatting drift in these files is never caught locally and only surfaces in
CI.

## Acceptance criteria

- Extend the pre-commit `lint-staged` configuration (`.lintstagedrc.mjs`) so
  authored `.mjs` files under `eslint/` are run through `prettier --write`
  (and `eslint --fix` if appropriate), matching how `.ts`/`.json` files are
  already handled.
- Verify: staging a deliberately mis-formatted `eslint/*.mjs` file and
  committing reformats it via the hook (no longer "no matching tasks").
- Confirm the existing committed `eslint/*.mjs` files remain `prettier --check`
  clean.
