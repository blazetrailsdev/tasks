---
title: "activerecord: nested-attributes assigners branch on a maybe-promise setAttributes and association read"
status: blocked
updated: 2026-10-09
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps:
  - reopen-rfc-0087-constructor-arm-for-association-io-at-assignment
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-10-09T21:39:52Z"
assignee: "nested-attributes-maybe-promise-assignment-arms"
blocked-by: "Waits on reopen-rfc-0087-constructor-arm-for-association-io-at-assignment (owner ruling 2026-10-08), the same root as assign-attributes-pending-promise-chain-arms: the generated xAttributes= writer is reached synchronously from new Foo({...}) and assignAttributes, so its body cannot be async (an await defers scalar writes past sync readers and turns Rails' raises into rejections), and with setAttributes / the association read answering a promise only when I/O is owed, each continuation needs a promise-or-value branch. The trails PR for this bundle converged what does not depend on the design (options read unguarded, attributes[id].blank?/present?, Rails' if/elsif chain, raise_nested_attributes_record_not_found! as an instance method reading reflection.klass.name); the two @inventedArm if receipts stay CONVERGEABLE here."
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-root-g-p-part-2-residue`. Two
`packages/activerecord/src/nested-attributes.ts` bodies still carry branches Rails does not have,
because `record.setAttributes(...)` answers `Promise<void> | void` and a one-to-one association read
is a promise while the association is unloaded. Both carry
`@inventedArm if — CONVERGEABLE nested-attributes-maybe-promise-assignment-arms`.

- `assignToOrMarkForDestruction` — Rails
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/nested_attributes.rb:576-579`) is
  `record.assign_attributes(attributes.except(*UNASSIGNABLE_KEYS))` then
  `record.mark_for_destruction if has_destroy_flag?(attributes) && allow_destroy`. The port ends in
  `pending ? pending.then(markIfRequested) : markIfRequested()`.
- `assignNestedAttributesForOneToOneAssociation` — Rails (`nested_attributes.rb:423-458`) reads
  `existing_record = send(association_name)`. The port re-enters itself through
  `assoc.reader`'s promise when the association is unloaded, branches on
  `pending ? pending.then(...)` after `existingRecord.setAttributes(assignable)`, and on
  `built instanceof Promise` after the `build_#{association_name}` send. It also reads
  `nestedAttributesOptions[associationName] ?? {}`, `options.updateOnly ?? false` and a local
  `hasNestedId` where Rails reads `options[:update_only]` and `attributes["id"].blank?`.

The collection twin (`assignNestedAttributesForCollectionAssociation`) chains the same
maybe-promise through its `assignRecords` closure, and `raiseNestedAttributesRecordNotFoundBang`
still takes the record as a parameter where Rails' is an instance method
(`nested_attributes.rb:619-623`).

RFC 0087 settled `setAttributes` as the awaitable mass-assignment surface, so the convergence is in
how these bodies consume it, not in making mass assignment synchronous.

## Acceptance criteria

- [ ] Both bodies take Rails' branches in Rails' order, with one awaited path in place of the
      `pending ? … : …` / `instanceof Promise` arms, or the shape is ratified in
      `packages/activerecord/CLAUDE.md` and the receipts become `PERMANENT`.
- [ ] The two `@inventedArm if — CONVERGEABLE` receipts are gone or `PERMANENT`.
- [ ] `nested-attributes*.test.ts` and `autosave-association*.test.ts` green;
      `pnpm parity:api:calls` and `pnpm parity:api:arms:throws` green.
