---
title: "Batch prettier invocations in manifest emitters to cut prelint overhead"
status: draft
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`writeJsonManifest()` (`scripts/api-compare/write-json-manifest.ts`, added in
PR #4987) shells out to the prettier CLI once per manifest because prettier 3
has no synchronous `format` and the emitters are transpiled to CJS by tsx,
where top-level `await` is a hard esbuild error.

Measured cost: ~330ms of prettier startup per manifest, ~2s added to
`pnpm prelint` (9.2s total on this host). Six write sites today, more once
`ratchet-exclude-emitters-prettier-churn` lands.

A fast path skipping structurally-unchanged manifests was written and
**deliberately reverted** during PR #4987: it would refuse to repair a file an
older stringify-based emitter had already churned, which is the recovery case
that matters. Do not reintroduce a skip-on-unchanged path — that decision has
evidence behind it.

Viable directions instead:

- Batch: have each emitter collect its writes and format them in one prettier
  invocation (`--write` over N paths) at process end.
- Convert the already-async emitters (`build-rails-tosql-manifest.ts`,
  `build-rails-error-manifest.ts`, `schema-compare/compare.ts`) to the prettier
  JS API as `generate-fixture-parity-map.ts:184-190` does — but only if the sync
  and async paths can be proven to produce byte-identical output, since the
  single-code-path property is what currently keeps the manifests from drifting
  apart.

Low priority: this is build-script latency, not test or CI-critical-path time.

## Acceptance criteria

- `pnpm prelint` prettier overhead materially reduced (target: one prettier
  process per emitter run rather than one per manifest).
- Every tracked manifest still reproduces byte-identically — verify by
  re-emitting and diffing committed bytes, not via `prettier --check`.
- No skip-on-unchanged fast path (see above).
- `scripts/api-compare/write-json-manifest.test.ts` still green, including the
  ignored-path and self-repair cases.
