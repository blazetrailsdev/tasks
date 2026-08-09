---
title: "rails-private-method-set-must-be-a-committed-runtime-artifact"
status: ready
updated: 2026-08-09
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`method-missing-proxy-visibility-from-rails-private-manifest` needs the Ruby-side
private-method set at **runtime**, inside `@blazetrails/activesupport`'s
`methodMissingProxy` (`packages/activesupport/src/method-missing-proxy.ts:34`,
`respondsTo`). That manifest exists today only as a lint input, and it is not
reachable from a runtime package:

- `eslint/rails-private-methods.json` is **not committed** (`git ls-files eslint/`
  lists only the rule + config). It is built by
  `scripts/build-rails-privates-manifest.ts` from
  `scripts/api-compare/output/rails-api.json`, which needs Ruby + `vendor/rails`.
- Per `eslint/rails-private-jsdoc.config.mjs:4-10`, it "only exists in the
  `rails-comparison` CI job (the one with Ruby)". Every other job — including
  the package builds and the unit-test lanes — runs without it.
- `eslint/rails-private-jsdoc.mjs:26-31` reads it with **sync `fs`** and
  degrades to `{ files: {} }` when absent. Both are fine for a lint rule and
  neither is available to a shipped runtime package: `node:*` imports and
  `process.*` are banned there, fs must be async, and an eager JSON import
  would fail the build in every job that lacks Ruby.

So the visibility story cannot land until the private set is a checked-in,
freshness-gated artifact that a runtime package may import.

## Acceptance criteria

- [ ] The Ruby-side private-method set is available to runtime code as a
      committed artifact a package can import with no `node:*`/fs access
      (e.g. a generated `.ts` module under an existing generated-source tree).
- [ ] A CI gate fails when the committed artifact drifts from what
      `pnpm rails-privates:manifest` regenerates, the way the other generated
      parity manifests are gated.
- [ ] `eslint/rails-private-jsdoc.mjs` keeps working (either reading the new
      artifact or unchanged).
- [ ] No new runtime dependency, and no load-order edge into
      `@blazetrails/activesupport` at module-eval time.
