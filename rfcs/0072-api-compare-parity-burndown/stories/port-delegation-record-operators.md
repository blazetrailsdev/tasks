---
title: "port-delegation-record-operators"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6097
claim: "2026-08-04T22:11:04Z"
assignee: "port-delegation-record-operators"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Delegation` delegates `[]`, `&`, `|`, `+`, `-` to `records` (relation/delegation.rb:101). In trails those names are only strings in `DELEGATED_ARRAY_METHODS` (`packages/activerecord/src/relation/delegation.ts`, which maps `[]`→`at`/`slice` and `+`→`concat`, and drops `&`/`|`/`-` as having no JS analogue) — there is no declared member in the delegation.ts container.

The method-ORDER manifest buckets delegation.rb into that file's `functions` container, so with no declared member the five operators cannot be pinned in `OPERATOR_SPELLING_BY_FQN` (`scripts/api-compare/operator-order-spelling.ts`) — the table only accepts spellings verified against a real TS member. Discovered while pinning module-level operator spellings (story `module-level-operator-spellings-unpinned`).

## Acceptance criteria

- [ ] Decide, against relation/delegation.rb:101, whether each of `[]`, `&`, `|`, `+`, `-` gets a real delegated member in delegation.ts (set intersection/union/difference on records for `&`/`|`/`-`) or is a documented no-analogue drop.
- [ ] For any that gain a member, add the verified entry to `OPERATOR_SPELLING_BY_FQN` with the `file:line` comment the table uses.
- [ ] Record the no-analogue decisions at the call site, not just in the PR body.
- [ ] `pnpm parity:api` stays green.
