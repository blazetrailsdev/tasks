---
title: "Route ratchet/exclude JSON generators through writeJsonManifest"
status: draft
updated: 2026-07-20
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4987 routed the six _manifest_ write sites (`build-rails-privates-manifest.ts`,
`build-rails-tosql-manifest.ts`, `build-rails-error-manifest.ts`,
`build-rails-file-structure-manifest.ts`, `schema-compare/compare.ts`) through
`writeJsonManifest()` in `scripts/api-compare/write-json-manifest.ts`, which
formats via the prettier CLI with `--ignore-path /dev/null`.

The **ratchet/exclude** generators were left on raw `JSON.stringify(x, null, 2)`.
Verified still-unconverted emitters:

- `scripts/generate-no-explicit-any-allowlist.mjs:38`
- `scripts/generate-fixture-parity-exclude.ts:44`
- `scripts/generate-standalone-associations-exclude.ts:76`

Five tracked files they emit are stringify-shaped today:

- `eslint/no-explicit-any-src-exclude.json`
- `eslint/test-fixture-parity-exclude.json`
- `eslint/rails-error-parity-exclude.json`
- `eslint/rails-error-parity-unported.json`
- `eslint/expected-fixtures-exclude.json`

These pass `prettier --check` **only by coincidence**: their current content is
flat arrays of long path strings that prettier would not collapse, so
stringify's layout and prettier's happen to agree. The trap is armed but
unfired — the first entry short enough for prettier to collapse onto one line
(or any nested short array) makes the file churn on every regeneration, exactly
the failure #4987 fixed for manifests.

Note `scripts/generate-fixture-parity-map.ts:184-190` already formats correctly
via the async prettier JS API; it is prior art, not a target.

## Acceptance criteria

- The three generators above emit through `writeJsonManifest()` (or, for the
  async ones, an equivalent that shares the same single formatting code path).
- Any resulting one-time reformat of the five tracked files is committed.
- Each file reproduces byte-identically when re-emitted — verify by re-running
  the generator and diffing committed bytes, NOT by `prettier --check` alone
  (`--check` skips ignored paths and so cannot prove the formatter ran; see
  #4987 where that made the verification circular).
- The `manifest emitters` source guard in
  `scripts/api-compare/write-json-manifest.test.ts` is extended to cover them.
