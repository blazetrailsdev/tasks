---
title: "Relocate core-ext-shaped activerecord names whose PERMANENT receipt is false"
status: draft
updated: 2026-09-17
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. These activerecord names carry
`@noRailsEquivalent PERMANENT` but Rails defines them in another `.rb` or another
gem (they score `moved`, or match a Ruby method under a different spelling):

| trails                                                                                                         | Rails definition                                                                                          |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ruby-first.ts:3` `first`                                                                                      | Enumerable#first — belongs in ruby-compat                                                                 |
| `ruby-drop.ts:5` `drop`                                                                                        | Enumerable#drop — belongs in ruby-compat                                                                  |
| `relation/query-methods.ts:1425` `toI`                                                                         | Object#to_i — belongs in ruby-compat                                                                      |
| `ruby-truthy.ts:3` `isRubyTruthy`                                                                              | Ruby truthiness — ruby-compat/activesupport (prior art `hoist-is-ruby-truthy-into-activesupport`, closed) |
| `inheritance.ts:108` `moduleParentChain`                                                                       | `activesupport/lib/active_support/core_ext/module/introspection.rb:53` `module_parents`                   |
| `relation.ts:583` `isPresent`, `:588` `presence`                                                               | `activesupport/lib/active_support/core_ext/object/blank.rb`                                               |
| `base.ts:1085` `subclasses`                                                                                    | `activesupport/lib/active_support/descendants_tracker.rb:98`                                              |
| `type/serialized.ts:6` `Coder` (+ `dump`/`load`/`objectClass`)                                                 | `activerecord/lib/active_record/coders/column_serializer.rb:6-29`                                         |
| `associations/singular-association.ts:19` `target`                                                             | `associations/association.rb:53` (not overridden in `singular_association.rb`)                            |
| `testing/method-call-assertions.ts` `assertCalledOnInstanceOf`, `assertNotCalledOnInstanceOf` (file-level tag) | `activesupport/lib/active_support/testing/method_call_assertions.rb:37,60`                                |
| `test-fixtures/use-transactional-tests.ts` `useTransactionalTests` (file-level tag)                            | `activerecord/lib/active_record/test_fixtures.rb:34`                                                      |

`validations.ts:125` `readAttributeForValidation` is the same shape but is
already owned by `ar-read-attribute-for-validation-is-not-send` (RFC 0023, draft).

## Acceptance criteria

- Each name either moves to the package/file that mirrors its Rails definition,
  or is deleted in favour of the existing port there.
- Its PERMANENT receipt is removed; file-level tags on the two testing files are
  removed or narrowed to names that genuinely score `novel`.
- `pnpm parity:api:extra:gate` green; no new extra surface in ruby-compat or
  activesupport.
