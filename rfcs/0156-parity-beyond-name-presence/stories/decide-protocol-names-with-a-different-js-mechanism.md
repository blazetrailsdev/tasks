---
title: "Decide, per name, how to score Ruby protocol methods whose JS form is a different mechanism"
status: claimed
updated: 2026-09-22
rfc: "0156-parity-beyond-name-presence"
cluster: "denominator"
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-22T14:49:45Z"
assignee: "block-parameter-parity-check"
blocked-by: null
closed-reason: null
---

## Context

Five names in `SKIP_GROUPS[0]` (`scripts/parity/conventions.ts:455-498`) are neither portable by name nor meaningless. JS has the capability, in a different place, so scoring a same-named TS method would be wrong and skipping silently hides real gaps. Rails definitions against TS members across arel, activemodel, activerecord and activesupport on `4e7c35e36b`:

| Ruby name                                | Rails defs | TS members | JS mechanism                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `is_a?` / `kind_of?`                     | 5          | 2          | `instanceof`, customised by `static [Symbol.hasInstance]` on the class being tested AGAINST. `TimeWithZone#is_a?(Time)` ports as a hook on `Time`, not a method on `TimeWithZone` (0155's `activesupport-time-with-zone-is-a-time`).                                                                                                  |
| `hash`                                   | 47         | 83         | None. `Map` and `Set` key by identity and call no hook.                                                                                                                                                                                                                                                                               |
| `eql?`                                   | 45         | 64         | None, same reason.                                                                                                                                                                                                                                                                                                                    |
| `method_missing` / `respond_to_missing?` | 37         | 33         | A `Proxy` trap. CLAUDE.md § "Records are not Proxies" decides records and leaves other classes per-class. 0155 has four stories here: `collection-proxy-does-not-delegate-association-names-to-scope`, `finder-respond-to-dynamic-finders-invisible-to-in`, `relation-dynamic-finders`, `rack-body-proxy-respond-to-missing-to-path`. |
| `respond_to?`                            | 5          | 12         | `rbObjRespondTo`, a function. `in` cannot see a name a `respondToMissing` would answer, which is `finder-respond-to-…`'s root cause.                                                                                                                                                                                                  |

The `hash` / `eql?` row carries its own question. trails has 83 `hash` and 64 `eql?` members and nothing in JS calls them. Either a ruby-compat keyed collection consumes them, in which case they are live and should be scored, or they are dead code that `parity:api:extra` should be flagging.

## Acceptance criteria

- A decision per row, recorded in the skip group's `reason` or in a CLAUDE.md section where it is a language shortcoming: score by a named alternative mechanism, keep skipped as PERMANENT, or decide per class.
- For `hash` / `eql?`: the PR body states who calls the existing TS members. If nothing does, a story is filed to remove them or to route them through a ruby-compat collection.
- For `method_missing` / `respond_to_missing?`: the Rails classes that define them are listed with each one's trails status (Proxy, typed forwarders, or nothing), so the four 0155 stories have one place to be decided from.
- For `is_a?`: the two existing TS members are checked against the `Symbol.hasInstance` form and a convergence story is filed if they differ.
- Decision and documentation only. No comparer change lands here. Each row that needs one gets its own story.
