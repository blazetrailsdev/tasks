---
title: "Converge & | + - [] record delegates onto Delegation members"
status: ready
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`relation/delegation.rb:100-103` delegates `:&, :|, :+, :-, :[]` to `:records`. After trails#7809, `&`/`|`/`-` are answered only by the private `ENUMERABLE_METHODS` table in the `Relation` constructor trap (`packages/activerecord/src/relation.ts`), as `intersection`/`union`/`difference`. `+` and `[]` are not delegated at all. The other names on that `delegate` line are real `Delegation` members in `relation/delegation.ts`.

## Acceptance criteria

- `&`, `|`, `+`, `-` and `[]` are members of `Delegation` (`relation/delegation.ts`), delegating to records through `withRecords`. Each takes the spelling from `OPERATOR_SPELLING_BY_FQN` (`scripts/api-compare/operator-order-spelling.ts`), with an `ActiveRecord::Delegation` row added there.
- Those names are gone from `ENUMERABLE_METHODS` in `relation.ts`.
- `parity:api:extra:gate` and `parity:api:calls` stay green.
