---
title: "Rename readonlyAttributeQ and the remaining AR Q names (utcQ, savedChangesQ, test-model closeToQ / ratingQ)"
status: draft
updated: 2026-09-22
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `Q` predicate spelling is rejected: predicates port as `isX` (or the bare
camel / the quoted literal `"x?"` where a sibling collides), never `xQ`. The
drop-q-predicate-suffix PR removed the `Q` candidate from `rubyMethodToTs`
(`scripts/parity/conventions.ts`).

This slice is the remaining ActiveRecord `*Q` names:

| trails                                                                                                                                                                                                | Rails / Ruby                                                                                                       | target                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `readonlyAttributeQ` — `packages/activerecord/src/readonly-attributes.ts:28` (callers `:34,:43`, mixin `:56`), `base.ts:1164` `declare static`, `persistence.ts:862,1131`, `attribute-methods.ts:513` | `readonly_attribute?(name)` — `readonly_attributes.rb:43`                                                          | `isReadonlyAttribute`                                                                                                                                             |
| `utcQ` — module-private function in `connection-adapters/abstract/quoting.ts:253` (caller `:290`)                                                                                                     | Ruby core `Time#utc?`, called at `abstract/quoting.rb:187` (`value.getutc if !value.utc?`)                         | `isUtc`                                                                                                                                                           |
| `savedChangesQ` — local lambda in `associations/builder/has-one.ts:112` (used `:115,:119`)                                                                                                            | `if: :saved_changes?` — `associations/builder/has_one.rb:51,53` (a Symbol naming `saved_changes?`, `dirty.rb:113`) | pass the method name the way the callback idiom takes a Ruby Symbol, `if: "isSavedChanges"` if the callback chain accepts it; otherwise an `isSavedChanges` local |
| `Customer#closeToQ` — `test-helpers/models/customer.ts:15` (caller `aggregations.test.ts`)                                                                                                            | `Customer#close_to?` — `activerecord/test/models/customer.rb:24`                                                   | `isCloseTo`                                                                                                                                                       |
| `Company#ratingQ` — `test-helpers/models/company.ts:466`                                                                                                                                              | `Company#rating?` — `activerecord/test/models/company.rb:201`                                                      | `isRating`                                                                                                                                                        |

Tooling comments and fixtures that name `readonlyAttributeQ` as an example
(`scripts/api-compare/compare.ts:4376`, `extract-ts-api.ts:2380`,
`extract-ts-api.test.ts:207-209`, `arity.test.ts:269`) should follow the rename
so no stale name remains.

## Acceptance criteria

- None of `readonlyAttributeQ`, `utcQ`, `savedChangesQ`, `closeToQ`, `ratingQ`
  remain in `packages/activerecord/src` (source, test-helpers or tests) or in the
  `scripts/api-compare` comments/fixtures listed above.
- `pnpm parity:api` activerecord coverage does not drop and
  `readonly_attributes.rb` `readonly_attribute?` scores as ported.
- `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` are green.
