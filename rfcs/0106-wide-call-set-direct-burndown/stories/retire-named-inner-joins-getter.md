---
title: "Retire _namedInnerJoins: converge its last three readers and delete the getter"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6582
claim: "2026-08-15T23:25:26Z"
assignee: "retire-named-inner-joins-getter"
blocked-by: null
closed-reason: null
---

## Context

PR #6579 converged the five cited `_namedInnerJoins` readers onto `joins_values`.
Three trails-only readers of the getter remain, none of which Rails has:

- `packages/activerecord/src/associations/association-scope.ts:1003-1008`
- `packages/activerecord/src/associations/preloader/through-association.ts:438`
- `packages/activerecord/src/relation/merger.ts:151-164` (also reads `_isNamedJoinValue`)

Rails reads `joins_values` at each of the corresponding sites
(`association_scope.rb` `last_chain_scope`/`add_constraints`,
`preloader/through_association.rb#through_scope`,
`relation/merger.rb:110-125` — `relation.joins!(*other.joins_values)`).

## Converged shape

Each site reads `joinsValues` and lets `select_association_list`
(query_methods.rb:1810-1823) do the named-vs-raw partition, as
`selectAssociationList` / `selectInnerNamedJoins` already do. Once no reader
remains, `_namedInnerJoins` and its `_joinValues` complement collapse to the
single insert-time discriminator `joins()` needs, and the getters are deleted.

## Acceptance criteria

- [ ] No `_namedInnerJoins` reader outside the `joins()` insert-time discriminator.
- [ ] The `_namedInnerJoins` / `_joinValues` getters are deleted (or reduced to the insert path).
- [ ] `pnpm parity:api:calls` / `:args` non-regressed; SQLite, PG, MySQL green.
