---
title: "Four string-keyed `new Hash()` sites become plain objects where Rails has a `{}`"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: carrier-audit
packages: [activerecord, activemodel, actionpack]
deps: [native-hash-merge-sites]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Hash` (`packages/ruby-compat/src/hash.ts:985`) exists for the default seat,
`eql?` keying over object keys, `compare_by_identity`, `FL_FREEZE` and the
iteration level. Most of its 58 non-test construction sites outside `hash.ts`
use one of those. Four of those are here: they are keyed by strings and Rails has a plain `{}` there. A fifth, `StatementPool`'s per-pid cache, is `native-hash-statement-pool-cache-is-a-plain-object`, held behind the RFC's open question 4.

| trails site                                                  | Rails                                                                | What Rails builds                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `packages/activerecord/src/persistence.ts:657`               | `activerecord/lib/active_record/persistence.rb:616`                  | `attributes.each_with_object({})` in `update_columns`                                        |
| `packages/actionpack/src/test-helpers/abstract-unit.ts:535`  | `actionpack/test/abstract_unit.rb:394` `parse_set_cookies_headers`   | a hash keyed by cookie name; read the body first and leave the site if it is not a bare `{}` |
| `packages/activemodel/src/attribute-mutation-tracker.ts:207` | `activemodel/lib/active_model/attribute_mutation_tracker.rb:163-165` | `NullMutationTracker#changed_values` is `{}`                                                 |
| `packages/activemodel/src/attribute-mutation-tracker.ts:211` | `attribute_mutation_tracker.rb:167-169`                              | `NullMutationTracker#changes` is `{}`                                                        |

A further candidate is NOT in scope:
`packages/activesupport/src/hash-with-indifferent-access.ts:581`
(`HWIA#to_hash`). Rails is `copy = Hash[self]; …; set_defaults(copy)`
(`activesupport/lib/active_support/hash_with_indifferent_access.rb:376-381`),
so the result carries the receiver's default and needs the seat. RFC 0129's
`hwia-to-hash-returns-ruby-compat-hash` made it a `Hash` deliberately.

## Acceptance criteria

- [ ] Each of the four sites is a plain object, typed `Record<string, T>`, and
      its readers use the native forms from the RFC's § "Per-name decisions".
- [ ] Before each conversion, every consumer of the value is read: a consumer
      that calls a `Map` method on it (`.get`, `.set`, `.has`, `.size`,
      iteration as `[k, v]`) is converted in the same PR, and one that needs a
      `Hash` feature means the site stays, with the reason in the PR body.
- [ ] `NullMutationTracker#changedValues` / `#changes`: the non-null tracker
      returns a `HashWithIndifferentAccess` (`attribute_mutation_tracker.rb:19`,
      `:27`), so callers already handle two return types in Rails. Confirm the
      declared return type on `Dirty` still type-checks, and say in the PR how.
- [ ] Call gates green with no baseline row added.
- [ ] `pnpm vitest run` on each touched file's test passes.

## Notes

`persistence.ts:658` is also an `eachPair` site in
`native-hash-each-pair-sites`. This story depends on that one, so the two never edit the line at once.
