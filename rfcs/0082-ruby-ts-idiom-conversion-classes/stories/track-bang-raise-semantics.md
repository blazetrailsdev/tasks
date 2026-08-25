---
title: "Track: bang raise-on-failure semantics"
status: ready
updated: 2026-07-27
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
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

# Track: bang raise-on-failure semantics

## Context

Naming (`save!` → `saveBang`) is settled and CI-matched by
`rubyMethodToTs` (`scripts/api-compare/conventions.ts:635`). What still
diverges piecemeal is the contract: bang variants raise (`RecordNotFound`,
`RecordNotSaved`) instead of returning false/nil, persist where the non-bang
mutates memory, and loaded-collection ordinal bangs must not requery. The raise
contract is documented at
`packages/activerecord/src/relation/finder-methods.ts:72`; Rails side e.g.
`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb`
(`find!`/`take!` family) and `persistence.rb` (`save!`).

Existing scattered stories (reference, do not re-home): open —
`converge-performfind-raises-onto-raise-record-not-found-bang` (0023, draft),
`append-bang-derive-failure-from-push-return` (0075, draft). Done precedent —
`finder-bang-ordinal-raise-record-not-found-message-fidelity` (0047),
`collection-proxy-last-take-bang-no-requery-when-loaded`,
`collection-proxy-ordinal-bang-no-requery-when-loaded`,
`defineenum-bang-uses-update-column-not-update-bang`,
`enum-bang-in-memory-not-persisting`, `increment-bang-persists-db-diff`,
`save-through-record-uses-bang-save`.

## Acceptance criteria

- Inventory of all `*Bang` symbols (~315 across packages) paired with their
  Rails bang bodies; each verified for the raise/persist contract or flagged.
- Divergent pairs fixed via child stories here (judgment per pair — read the
  Rails body; error message parity per the existing rails-error-parity checks).
- The two open draft stories above resolved or linked.
