---
title: "method-order-manifest-actionpack-package-dirs-are-stale"
status: draft
updated: 2026-08-29
rfc: "0126-fidelity-tooling-continuation"
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

`PACKAGE_DIRS` in `scripts/build-rails-file-structure-manifest.ts:41-50` maps
the Ruby packages `actiondispatch` and `actioncontroller` to
`packages/actionpack/src/actiondispatch` and
`packages/actionpack/src/actioncontroller`. Neither directory exists — the
actionpack source tree is `packages/actionpack/src/action-dispatch`,
`action-controller`, `abstract-controller`, `action-pack` (`ls
packages/actionpack/src`).

So every actionpack entry the manifest emits is keyed to a TS path no file has,
e.g. `packages/actionpack/src/actiondispatch/journey/scanner.ts` for
`packages/actionpack/src/action-dispatch/journey/scanner.ts`. The
`rails-file-structure-method-order` rule looks the file up by path, finds
nothing, and enforces nothing — the same silent no-op class as the last-segment
collision drop (`method-order-last-segment-collision-drops-bucket-silently`,
which fixed the collision half).

It is latent rather than live today because the rule's enrollment in
`eslint.config.mjs:509` is `packages/arel/src/**` + `packages/activemodel/src/**`
only; actionpack is not enrolled yet. But the manifest rows are wrong now, and
they will be wrong the moment actionpack enrolls.

Noticed while fixing the collision drop for
`actiondispatch/journey/scanner.rb`: the recovered bucket lands at the wrong
path.

## Acceptance criteria

- `PACKAGE_DIRS` points `actiondispatch` / `actioncontroller` at the directories
  that actually exist under `packages/actionpack/src/`.
- Rerun `pnpm parity:api` and confirm the emitted actionpack keys in
  `eslint/rails-file-structure-method-order.json` resolve to real files on disk.
- Consider a build-time assertion that every emitted `PACKAGE_DIRS` root exists,
  so a future rename fails the build instead of silently un-keying a package.
