---
title: "Custom rule: forbid eslint-disable of no-explicit-any in AR"
status: draft
updated: 2026-06-18
rfc: "0037-no-explicit-any-enforcement"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Flipping `no-explicit-any` to `error` (sibling story `mechanism`) shifts the
workaround from `as any` (visible, greppable) to inline
`// eslint-disable-next-line @typescript-eslint/no-explicit-any`. The user's
explicit requirement: no workarounds — disabling the rule inline must itself
be a lint error. The repo has an established custom-rule convention: a
`.mjs` rule + co-located `.test.mjs` under `eslint/`, wired in
`eslint.config.mjs` (e.g. `no-raw-sql.mjs`, `require-canonical-schema.mjs`).

## Acceptance criteria

- A new custom ESLint rule under `eslint/` (with co-located `.test.mjs`) flags
  any disable directive that targets `@typescript-eslint/no-explicit-any`:
  `eslint-disable`, `eslint-disable-next-line`, `eslint-disable-line`, and a
  bare `// eslint-disable`/`/* eslint-disable */` with no rule list (which
  disables everything, including this rule).
- Rule is `error` from day one for `packages/activerecord/src/**/*.ts`; no
  allowlist.
- Tests cover: targeted disable (flagged), bare disable (flagged), disable of
  an unrelated rule (allowed), normal code (allowed).
- Wired into `eslint.config.mjs`; `pnpm lint` green (no existing AR file
  disables `no-explicit-any` inline — verify with grep first; if any exist,
  fix them in this PR or list them as a blocker story).
