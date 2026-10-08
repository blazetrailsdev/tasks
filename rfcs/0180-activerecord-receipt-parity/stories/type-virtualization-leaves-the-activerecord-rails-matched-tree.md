---
title: "activerecord: type-virtualization leaves the Rails-matched tree and drops its eleven receipts"
status: closed
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "postponing for later"
---

## Context

`packages/activerecord/src/type-virtualization/` (auto-import, index, resolve-target, synthesize,
transitive-extends-walker, ts-api, type-registry, virtualize, walker) is the trails-only compiler
layer that synthesizes `declare` members for models. No file in it has a Rails counterpart: nothing
under `vendor/rails/v8.0.2/activerecord/lib/active_record/` mirrors it. Each file carries a
file-level `@noRailsEquivalent` receipt, and `walker.ts`'s `findIncludeCalls` carries one of its own.
They were tagged `PERMANENT`, but no CLAUDE.md section ratifies the directory, so the audit in
`activerecord-audit-permanent-receipts-subsystems-part-2` re-tagged all eleven
`CONVERGEABLE type-virtualization-leaves-the-activerecord-rails-matched-tree`.

The directory is tooling, not ported surface. It sits inside the tree `parity:api:extra` measures
against `active_record/`, which is the only reason it needs receipts at all. Consumers:
`packages/activerecord/package.json` exports, `trails-tsc`, the website's virtualizer, and the
`dx-tests` paths.

## Acceptance criteria

- [ ] The type-virtualization modules live outside the activerecord Rails-matched tree (their own
      package, or a tree both compare populations already exclude), so none needs a
      `@noRailsEquivalent` receipt.
- [ ] All eleven `CONVERGEABLE type-virtualization-leaves-the-activerecord-rails-matched-tree`
      receipts are deleted, including the two carrying `MOVED-BY-SHORT-NAME: walk.` prose.
- [ ] Every importer of the subpath is repointed (package exports, `trails-tsc`, website aliases,
      `dx-tests/tsconfig` paths, the FileStore worker resolve hook if it lists the subpath).
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` green.
