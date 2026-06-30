---
rfc: "0044-call-set-parity-fidelity-burndown"
title: "ActiveRecord call-set parity fidelity burndown to zero"
status: closed
created: 2026-06-23
updated: 2026-06-30
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "real-omission"
  - "equivalent-restructure"
  - "infra"
---

## Summary

The new advisory **call-set parity** dimension in `api:compare` (PR #4002)
flags name-matched method pairs whose ported TS body omits a fidelity-critical
call Rails makes to another ported method. On `activerecord` it flags **23**
pairs. This RFC drives that list to **zero unexplained entries**: each pair is
either a real fidelity bug (the TS body genuinely skips behavior Rails performs
— converge to Rails) or a confirmed behavioral equivalent the coarse heuristic
cannot see (the call is realized through a different but equivalent path —
suppress via a documented ratcheting baseline). After triage the advisory gates
at zero, so any regression or newly-ported gap is caught.

## Motivation

The call-set check is a coarse body-fidelity signal: for a matched pair it
compares the set of methods Rails' body invokes against the set the TS body
invokes, gated to an allowlist of fidelity-critical primitives
(`SIGNIFICANT_CALLS`: callback / transaction / locking / persistence /
dirty-tracking control flow). Unlike arity/option-keys/literals, it can see
_behavioral_ drift — e.g. a ported `update` that never routes through `save`, or
a `_create_record` that forgets `changes_applied` (leaving dirty state
uncleared after insert).

The 23 flagged pairs (from `output/call-mismatches.json`, regenerate with
`pnpm api:compare --package activerecord`):

| TS file                                       | Ruby method                     | Missing call(s)                              |
| --------------------------------------------- | ------------------------------- | -------------------------------------------- |
| attribute-methods.ts                          | `_touch_row`                    | `clear_attribute_changes`, `changes_applied` |
| attribute-methods.ts                          | `_update_record`                | `changes_applied`                            |
| attribute-methods.ts                          | `_create_record`                | `changes_applied`                            |
| autosave-association.ts                       | `save_collection_association`   | `destroy`, `save`                            |
| autosave-association.ts                       | `save_has_one_association`      | `destroy`, `save`                            |
| autosave-association.ts                       | `save_belongs_to_association`   | `destroy`, `save`                            |
| associations/has-one-association.ts           | `replace`                       | `save`                                       |
| base.ts                                       | `update`                        | `save`                                       |
| base.ts                                       | `update!`                       | `save!`                                      |
| persistence.ts                                | `update_attribute!`             | `save!`                                      |
| relation.ts                                   | `update_all`                    | `update`                                     |
| internal-metadata.ts                          | `update_entry`                  | `update`                                     |
| nested-attributes.ts                          | `accepts_nested_attributes_for` | `update`                                     |
| connection-adapters/abstract-mysql-adapter.ts | `mismatched_foreign_key`        | `update`                                     |
| secure-token.ts                               | `has_secure_token`              | `update!`                                    |
| associations/collection-association.ts        | `concat`                        | `transaction`                                |
| associations/collection-association.ts        | `replace`                       | `transaction`                                |
| connection-adapters/sqlite3-adapter.ts        | `alter_table`                   | `transaction`                                |
| migration.ts                                  | `ddl_transaction`               | `transaction`                                |
| associations/builder/has-one.ts               | `touch_record`                  | `touch`                                      |
| touch-later.ts                                | `touch_deferred_attributes`     | `touch`                                      |
| locking/pessimistic.ts                        | `lock!`                         | `reload`                                     |
| locking/pessimistic.ts                        | `with_lock`                     | `lock!`                                      |

Some are likely true bugs (the dirty-tracking `changes_applied` cluster, the
locking chain); some are likely equivalent restructuring (a macro like
`accepts_nested_attributes_for` builds a closure that calls `update` indirectly;
`mismatched_foreign_key` builds an error message). The campaign is to
**investigate each, with the corresponding Rails source open**, and resolve it.

## Design

For each flagged pair, read the Rails method body (vendored under
`vendor/rails/activerecord/lib/...`) and the ported TS method, then:

1. **Real omission** → fix the TS body so it makes the call (or the
   behaviorally-required equivalent), converging to Rails. Cover with a test
   that asserts the now-correct behavior, matching the Rails test name when one
   exists (`test:compare` fidelity).
2. **Confirmed behavioral equivalent** → add an entry to the ratcheting
   baseline (`eslint/`-style exclude JSON, see Rollout story 1) with a one-line
   justification of _why_ the call is satisfied by a different path. This is NOT
   ratifying a behavioral deviation — only recording a true negative of a coarse
   heuristic. Any actual behavioral difference must converge, never be excluded.

The baseline only shrinks (or stays flat with justified equivalents); CI fails
on any new unexplained flag.

## Non-goals

- **Widening `SIGNIFICANT_CALLS`.** This RFC burns down the current allowlist's
  output; tuning the allowlist is separate (it would change the population).
- **Other packages.** Scoped to `activerecord`; arel/activemodel call-set
  burndown, if warranted, are their own RFCs.
- **`super`-call fidelity.** The Ruby extractor does not record `super`
  (extract-ruby-api.rb), so it's invisible to this dimension by construction.

## Rollout

1. Phase 1 — `call-mismatches-ratcheting-baseline` (infra; gate the advisory at
   zero with a documented exclude baseline + CI check).
2. Phase 2 — the per-cluster audit/fix stories, each independent and
   non-overlapping in files, depending only on Phase 1:
   - `dirty-tracking-changes-applied-cluster`
   - `autosave-association-save-destroy-cluster`
   - `update-delegates-to-save-cluster`
   - `transaction-wrapping-cluster`
   - `touch-and-pessimistic-locking-cluster`

## Verification

`output/call-mismatches.json` for `activerecord` reaches **0 unexplained
entries**: every one of the 23 is either fixed (call now present) or has a
justified baseline entry. The baseline count is the burndown metric; it only
decreases over time. CI fails on any new flag not in the baseline.

## Open questions

1. **Should confirmed equivalents live in a shared `*-exclude.json` (like the
   other rails-\* rules) or inline annotations?** Recommendation: a single
   `eslint/`-adjacent `call-mismatches-exclude.json` keyed by
   `tsFile + rubyName + call`, mirroring the existing exclude-file convention so
   the ratchet tooling is uniform. Resolve in Phase 1.
