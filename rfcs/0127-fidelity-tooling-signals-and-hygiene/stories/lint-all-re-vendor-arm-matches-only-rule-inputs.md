---
title: "LINT_ALL_RE's vendor/ arm matches only the vendored paths lint rules read"
status: draft
updated: 2026-10-29
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`.github/workflows/ci.yml:158` in trails sets
`LINT_ALL_RE='^(eslint\.config\.mjs$|eslint/|package\.json$|pnpm-lock\.yaml$|tsconfig[^/]*\.json$|vendor/|…)'`.
Any changed path under `vendor/` makes the Lint job lint the whole tree. The
comment above it (`ci.yml:142-157`) justifies the `vendor/` arm with the rules
that read vendored Rails sources: `eslint/no-load-schema-with-stubbed-ddl.mjs:38`
and `eslint/expected-fixtures.mjs`. Both read only `vendor/rails/<version>/…`.

As a result, a PR that only vendors an unrelated gem pays for a full-tree lint
that no rule input needs. trails#9453 (vendor rake 13.2.1) is an example:
its Lint job took 9m56s serial, or about 5m36s after trails#9456 pinned
`--concurrency 2`.

## Acceptance criteria

- `LINT_ALL_RE`'s `vendor/` arm matches only the vendored paths a lint rule or
  `prelint` manifest actually reads. Enumerate them by grepping `eslint/` and the
  `prelint` scripts in `package.json` for `vendor/`.
- A PR touching only `vendor/<other-gem>/…` produces a scoped (or empty) lint
  run, which the `changes` job's output shows.
- A PR touching `vendor/rails/…` still lints the full tree.
