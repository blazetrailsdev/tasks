---
title: "Relocate core-ext-shaped activerecord names whose PERMANENT receipt is false"
status: in-progress
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: 5
pr: trails#7995
claim: "2026-09-23T02:23:35Z"
assignee: "relocate-core-ext-shaped-permanent-receipts"
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. These activerecord names carry
`@noRailsEquivalent PERMANENT` but Rails defines them in another `.rb` or another
gem (they score `moved`, or match a Ruby method under a different spelling):

| trails | Rails definition |
| ------ | ---------------- |

| `relation.ts:583` `isPresent`, `:588` `presence` | `activesupport/lib/active_support/core_ext/object/blank.rb` |
| `base.ts:1085` `subclasses` | `activesupport/lib/active_support/descendants_tracker.rb:98` |
| `type/serialized.ts:6` `Coder` (+ `dump`/`load`/`objectClass`) | `activerecord/lib/active_record/coders/column_serializer.rb:6-29` |
| `associations/singular-association.ts:19` `target` | `associations/association.rb:53` (not overridden in `singular_association.rb`) |
| `testing/method-call-assertions.ts` `assertCalledOnInstanceOf`, `assertNotCalledOnInstanceOf` (file-level tag) | `activesupport/lib/active_support/testing/method_call_assertions.rb:37,60` |
| `test-fixtures/use-transactional-tests.ts` `useTransactionalTests` (file-level tag) | `activerecord/lib/active_record/test_fixtures.rb:34` |

Not in scope (the audit first listed them, then found they do not measure as
Rails names): `ruby-first.ts:3` `first`, `ruby-drop.ts:5` `drop`,
`relation/query-methods.ts:1425` `toI` score `moved` only via coincidental
owners; `ruby-truthy.ts:3` `isRubyTruthy` and `inheritance.ts:108`
`moduleParentChain` score `novel` — the latter is a `string[]` prefix builder,
not `Module#module_parents`
(`activesupport/lib/active_support/core_ext/module/introspection.rb:53-64`).
They are invented helpers owned by
`relabel-invented-model-and-relation-helper-permanent-receipts`.

`validations.ts:125` `readAttributeForValidation` is the same shape but is
already owned by `ar-read-attribute-for-validation-is-not-send` (RFC 0023, draft).

## Acceptance criteria

- Each name either moves to the package/file that mirrors its Rails definition,
  or is deleted in favour of the existing port there.
- Its PERMANENT receipt is removed; file-level tags on the two testing files are
  removed or narrowed to names that genuinely score `novel`.
- `pnpm parity:api:extra:gate` green; no new extra surface in ruby-compat or
  activesupport.
