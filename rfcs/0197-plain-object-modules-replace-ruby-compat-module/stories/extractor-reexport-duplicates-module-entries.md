---
title: "extractor-reexport-duplicates-module-entries"
status: ready
updated: 2026-10-22
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ts-api.ts` records an `export { X } from "./y.js"` re-export as a second module entry keyed by, and with `file` set to, the re-exporting file. Its members carry the original declaration's lines and tags. Measured on main after trails#9163, 346 module entries are such copies across 19 packages: activesupport 69, actiondispatch 71, ruby-compat 65, actionview 46 and others. Most sit under `index.ts` barrels, which map to no Rails file, but some land on a Rails-mapped file and are counted there a second time. For example, `packages/activerecord/src/connection-adapters.ts:147` re-exports `Deduplicable` from `connection-adapters/deduplicable.ts`, so `connection-adapters.ts:Deduplicable` duplicates every member, including the `@internal` `deduplicated` counted by `countTsInternalNames` (`scripts/api-compare/extra-surface.ts`). Found while answering review on trails#9163.

## Acceptance criteria

- A re-export (`export { X } from`, `export * from`) creates no module or class entry under the re-exporting file. The entity is recorded once, at its declaring file.
- An extractor fixture test shows a re-exported plain module counted once by `countTsInternalNames` and absent from `collectTsFileNames` for the re-exporting file.
- Any extra-surface mark the fix lowers is narrowed with `pnpm parity:api:extra:tighten`. No mark is raised, and `parity:api` credit does not regress.
