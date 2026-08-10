---
title: "migrate-nested-attributes-assignments-to-awaitable-writer"
status: done
updated: 2026-08-06
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: []
deps-rfc: []
est-loc: 450
priority: 7
pr: 6159
claim: "2026-08-06T15:43:03Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

104 assignments through the generated nested-attributes property setter
(`pirate.shipAttributes = {...}`) live in ported tests. RFC 0087 §1 deletes that
setter; this story moves the call sites to the awaitable
`await pirate.setShipAttributes({...})`, which
`generateAssociationWriter` already generates alongside it
(`packages/activerecord/src/nested-attributes.ts`, the
`set${camelize(attrName, true)}` arm).

The two are not equivalent today and that is the point: the sync setter defers
displacement to the owner's next `save()`, while the awaitable one drains it at
the assignment expression, which is where Rails' `replace` does the work
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84`).
Migrating first therefore also converges the timing, and it must land before the
machinery deletion (`delete-nested-attributes-deferred-displacement`) so the
deletion has no live callers.

Count is at time of writing:
`grep -rn "[a-zA-Z]Attributes = " --include=*.test.ts packages/activerecord/src`.
Split across PRs by test file if it exceeds the 500-LOC ceiling; file the
remainder as a sibling story rather than fanning out PRs.

## Acceptance criteria

- [ ] Every `#{name}Attributes=` assignment in `packages/activerecord/src/**`
      becomes `await owner.set#{Name}Attributes({...})`.
- [ ] Test names unchanged; `pnpm parity:test` delta non-negative.
- [ ] Tests that specifically covered the _deferred_ timing (drain at `save()`)
      are converted to the assignment-time contract or deleted with a note, not
      left asserting a contract that no longer has a caller.
