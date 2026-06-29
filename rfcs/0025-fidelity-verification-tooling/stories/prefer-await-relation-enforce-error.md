---
title: "Flip prefer-await-relation to error and autofix all .toArray() sites"
status: ready
updated: 2026-06-29
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4279 added the `blazetrails/prefer-await-relation` ESLint rule, registered
at **`warn`** across `packages/{arel,activemodel,activerecord,activesupport}/src/**/*.ts`.
It flags `await <relation>.toArray()` and autofixes it to `await <relation>`
(relations are thenables that resolve to their loaded array; `.toArray()` has no
Rails counterpart — `Model.where(...)` is enumerated directly).

It was landed as `warn` rather than `error` because ~1700 existing call sites use
`.toArray()` as the established materializer, so flipping to `error` + autofixing
all of them in the same PR would have broken `pnpm lint` and blown far past the
500 LOC ceiling.

Rule + config:

- `eslint/prefer-await-relation.mjs`
- `eslint.config.mjs` (search `prefer-await-relation`, currently `"warn"`)

The rule is gated to the **directly-awaited position only** (`await x.toArray()`),
which an AST scan of the ESLint JSON report confirmed is false-positive-free:
all flagged sites are genuine awaited relations, and non-relation `.toArray()`
accessors (raw query `Result`, ActiveModel `Errors`, `OrderedHash`,
view-path/streaming wrappers) are not matched.

## Acceptance criteria

- Flip `blazetrails/prefer-await-relation` from `"warn"` to `"error"` in
  `eslint.config.mjs`.
- Run the autofix (`eslint . --fix`) across the scoped packages to convert every
  `await <relation>.toArray()` → `await <relation>`.
- `pnpm lint` passes with the rule at `error` (zero remaining violations).
- Manually re-verify any sites the autofix touched that look like non-relations
  (none expected given the await-only gate, but confirm) — do not let the autofix
  rewrite a non-relation `Result`/`Errors`/`OrderedHash` accessor.
- **This story is explicitly granted an exception to the 500 LOC PR ceiling** —
  the mechanical autofix sweep is expected to span ~1700 call sites. Note the
  exception in the PR body. Keep the change to the autofix + the one-line config
  flip; no unrelated edits.
