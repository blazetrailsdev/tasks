---
title: "api-compare: apply isSourceUnported guard to extra-surface walkMixin (parity with compare.ts)"
status: claimed
updated: 2026-06-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-23T13:57:41Z"
assignee: "extra-surface-walkmixin-unported-guard"
blocked-by: null
---

## Context

Follow-up surfaced in review of PR #3992 (extractor-capture-globalid-mixin-surface).
That PR added a cross-package mixin fallback to `extra-surface.ts`'s `walkMixin`
(`collectAllowedNames`), resolving railtie-injected cross-gem `include`s (e.g.
`GlobalID::Identification`) against a flat `crossPackageModules` map.

`walkMixin` in `scripts/api-compare/extra-surface.ts` (the `collectAllowedNames`
closure) has never had the `isSourceUnported` guard that `flattenIncludedMethodInfos`
applies at `scripts/api-compare/compare.ts:507`:

```ts
if (mod.file && isSourceUnported(mod.file, pkg)) continue;
```

Without it, a mixin whose source file we've explicitly declined to port would
still contribute its methods to the host's allowed set. Today this is harmless —
no unported cross-gem mixin is in `AMBIENT_RAILTIE_MIXINS`, and the local-path
behavior is unchanged (the asymmetry predates this PR) — but it becomes a latent
correctness gap the moment an unported mixin lands in the registry or is reached
via a `::`-qualified cross-package include.

## Acceptance criteria

- `walkMixin` in `extra-surface.ts` skips a resolved module whose `mod.file` is
  unported, mirroring `flattenIncludedMethodInfos` (compare.ts:507). The `pkg`
  argument must be threaded so `isSourceUnported(mod.file, pkg)` resolves with
  the correct package context (note: for a cross-package module, the owning
  package — not the host package — is the right context; decide and document).
- A unit test in `extra-surface.test.ts` asserts an unported mixin's methods do
  NOT enter the allowed set (so they remain flagged as extra surface).
- `pnpm api:compare` gate + api-compare test suites still pass; no change to
  current per-package novel totals (the guard is inert on today's registry).
