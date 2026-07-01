---
title: "Reconcile 4 surfaced moved-extras whose ported methods have unported source files"
status: ready
updated: 2026-06-23
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3999 applied the `isSourceUnported` guard to `extra-surface.ts`'s
`collectAllowedNames` walkMixin (mirroring `flattenIncludedMethodInfos` at
`scripts/api-compare/compare.ts:507`). With the guard in place the extra-surface
report now surfaces **4 previously-masked moved extras** — TS methods that ARE
ported but whose owning Rails mixin source file is on `UNPORTED_FILES`, so they
no longer get pulled into the host's `allowed` set:

- `Railties::ControllerRuntime` methods on `packages/activerecord/src/trailtie.ts`
  (injected via `on_load`; the port lives in
  `packages/activerecord/src/trailties/controller-runtime.ts` with tests in
  `controller-runtime.test.ts`).
- A `detailedMessage` mirror on `packages/activerecord/src/associations/errors.ts:44`
  (and the same method at lines 73, 112) — mirrors Rails
  `DidYouMean::Correctable#detailed_message`.

These are consistent with the api:compare side (which already excludes them),
but they represent a classification mismatch: we ported these methods yet their
source files are still flagged unported. Triage each: either drop the file from
`UNPORTED_FILES` (we did port the relevant surface), or — if the method is a
deliberate standalone mirror not backed by a ported source — add it to the
extra-surface allowlist so it stops showing as moved-extra noise.

Source: `scripts/api-compare/extra-surface.ts` `collectAllowedNames`,
`scripts/api-compare/unported-files.ts` (`UNPORTED_FILES`, `isSourceUnported`).

## Acceptance criteria

- Each of the 4 surfaced extras is triaged to a definite resolution
  (reclassify the source file as ported, or allowlist the method as an
  intentional mirror).
- `pnpm api:compare` extra-surface report no longer reports these as
  unexplained moved extras.
- No change to novel totals.
