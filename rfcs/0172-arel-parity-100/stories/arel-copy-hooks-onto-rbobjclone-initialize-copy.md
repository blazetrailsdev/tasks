---
title: "arel: port initialize_copy at its Rails name and copy through rbObjClone / rbObjDup"
status: done
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: receipts
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8302
claim: "2026-09-30T19:33:24Z"
assignee: "arel-copy-hooks-onto-rbobjclone-initialize-copy"
blocked-by: null
closed-reason: null
---

## Context

Split out of `arel-audit-permanent-receipts-against-claude-md`. CLAUDE.md names
`rbObjClone(obj)` / `rbObjDup(obj)` (`packages/ruby-compat/src/include.ts`, MRI
`rb_obj_clone` / `rb_obj_dup`) as the one spelling of Ruby `obj.clone` / `obj.dup`,
dispatching `initializeClone` / `initializeDup` / `initializeCopy` ported at their
Rails names, and says "Never open-code the `Object.create` + copy at a call site".
arel predates that idiom:

- `packages/arel/src/clone-support.ts:4` `objectClone` is exactly the open-coded
  `Object.assign(Object.create(proto), self)`, and `cloneSlot` (`:9`) dispatches
  to a TS `clone()`.
- Each Rails `initialize_copy(other)` is ported as a TS `clone()` that calls
  `objectClone(this)` then deep-copies its slots: `tree-manager.ts:73`
  (`tree_manager.rb:60`), `nodes/binary.ts:65` (`nodes/binary.rb:14`),
  `nodes/case.ts:62` (`case.rb:29`), `nodes/delete-statement.ts:56`
  (`delete_statement.rb:20`), `nodes/fragments.ts:27` (`fragments.rb:13`),
  `nodes/insert-statement.ts:38` (`insert_statement.rb:16`),
  `nodes/select-core.ts:79` (`select_core.rb:35`),
  `nodes/select-statement.ts:45` (`select_statement.rb:19`),
  `nodes/update-statement.ts:59` (`update_statement.rb:21`). `select_manager.rb:14`
  also defines one. (All under `vendor/rails/v8.0.2/activerecord/lib/arel/`.)
- `packages/arel/src/nodes/node.ts:60` `Node#dup` is `cloneSlot(this)` — Ruby's
  `Object#dup`, which arel does not define.
- `COPY_HOOKS` (`scripts/parity/conventions.ts`) currently credits a TS `clone()`
  / `dup()` as Rails' `initialize_copy`.

`objectClone` and `Node#dup` carry `@noRailsEquivalent CONVERGEABLE` receipts
pointing here.

## Acceptance criteria

- [ ] Each ported `initialize_copy` is an `initializeCopy(other)` method with
      Rails' body (`super` first, then the same ivar copies, same guards).
- [ ] Every copy of an arel node or manager goes through `rbObjClone` /
      `rbObjDup` (arel's own callers, e.g. `visitors/to-sql.ts:1088,1107`, and
      activerecord's), and `objectClone` / `cloneSlot` / `Node#dup` are deleted
      with their receipts.
- [ ] `pnpm parity:api:extra:gate` green with arel `novel` still 0 and `total`
      not raised; `pnpm vitest run packages/arel` green.
