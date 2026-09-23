---
title: "Check in a path.relative parity test for auto-import's relative specifier"
status: draft
updated: 2026-09-23
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`computeRelativeImport` in `packages/activerecord/src/type-virtualization/auto-import.ts`
(moved from activerecord-cli in trails#8003) builds the relative import specifier
segment-wise, because ruby-compat's `PathAdapter#relative` is optional
(`packages/ruby-compat/src/fs-adapter.ts:114-123`; the website VFS adapter omits it).
It resolves relative inputs through the required `getPath().resolve`, normalizes
`.`/`..`/empty segments with `..` clamped at the root, and compares Windows roots
(drive, UNC) and segments case-insensitively, returning the absolute target across
roots — i.e. `path.relative`'s semantics.

Three #8003 review rounds each found one missing semantic. A local fuzz harness
(152,445 cases vs `path.posix.relative` / `path.win32.relative`: real fixture/model
pairs, perturbed `.`/`..`/`//`, relative, drive, UNC, mixed-case, cross-root; the
pre-fix version failed 69,198) proved parity, but it is not checked in, so nothing
guards a regression.

## Acceptance criteria

- [ ] A `*.trails.test.ts` under `packages/activerecord/src/type-virtualization/`
      asserts `resolveAutoImports` emits the `path.posix.relative` /
      `path.win32.relative`-derived specifier for a seeded table covering: same dir,
      sibling/ancestor dirs, `.`/`..`/`//` segments, `..` past root, relative inputs,
      drive letters with mixed case, UNC roots, and cross-drive targets.
- [ ] The test fails against the pre-#8003-round-3 implementation (`git show 581f5f50d3:packages/activerecord/src/type-virtualization/auto-import.ts`).
