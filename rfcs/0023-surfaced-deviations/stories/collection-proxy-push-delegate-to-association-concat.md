---
title: "CollectionProxy#push should delegate to association concat instead of reimplementing the insert loop"
status: ready
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `CollectionProxy` delegates `concat` / `<<` / `push` / `append` to
`@association.concat`, which wraps the inserts in a transaction and accumulates
`result &&= insert_record(...); raise Rollback unless result`
(activerecord/lib/active_record/associations/collection_association.rb:127-135,
438-454). trails instead **reimplements** the insert loop directly in
`CollectionProxy#push` (packages/activerecord/src/associations/collection-proxy.ts,
the `insertAll` loop) rather than delegating to
`CollectionAssociation#concat` / `concatRecords`
(packages/activerecord/src/associations/collection-association.ts:180-222).

PR #4288 had to add the transaction wrap AND the `result`/`Rollback`
accumulation in BOTH places to converge behavior, because the runtime path is
`CollectionProxy#push` while the call-set parity surface is
`CollectionAssociation#concat`. This duplication is a divergence: the two
implementations can drift (e.g. one already had the transaction, the other did
not), and `set_owner_attributes`, type-mismatch raising, and through-record
building are forked across both files.

## Acceptance criteria

- `CollectionProxy#push`/`concat`/`<<` delegate to the association layer's
  `concat`/`concatRecords` (single insert/transaction/result-accumulation
  implementation), mirroring Rails' delegation.
- No behavior change: existing has-many / through / habtm push/concat tests
  stay green, including the `transactions when adding to persisted` rollback
  test added in #4288.
- The forked `insertAll` loop and its transaction+Rollback logic are removed
  from collection-proxy.ts once the association path owns it.
