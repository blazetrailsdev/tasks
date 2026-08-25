---
title: "replace and its five private helpers are a second copy of CollectionAssociation#replace"
status: done
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6752
claim: "2026-08-19T23:52:33Z"
assignee: "restore-transaction-record-state-composite-pk-arm"
blocked-by: null
closed-reason: null
---

## Context

Rails' proxy body is one line:

```ruby
def replace(other_array)     # collection_proxy.rb:391-393
  @association.replace(other_array)
end
```

`CollectionAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:242-256`)
owns the `load_target`/`original_target` capture and the persisted-vs-new-owner
split, and `replace_records` (`:418-428`) +
`replace_common_records_in_memory` (`:430-436`) + `difference`/`intersection`
(`:458`/`:463` in trails' port) own the rest.

`packages/activerecord/src/associations/collection-proxy.ts` carries a second
copy: `replace` (`:1971`, 15 code lines), `_replaceRecords` (`:2005`, 17),
`_replaceCommonRecordsInMemory` (`:2029`, 5), `_difference` (`:2045`, 3),
`_intersection` (`:2050`, 3), `_replaceTransaction` (`:2059`, 8) — **51 lines**.

The destinations already exist in
`packages/activerecord/src/associations/collection-association.ts`: `replace`
(`:717`), `persistReplacePlan` (`:778`), `difference` (`:458`),
`intersection` (`:463`), `transaction` (`:442`), `replaceOnTarget` (`:1418`).

Related open stories against the association-side body (dependencies, not
duplicates — they fix the destination, this story routes the proxy at it):
`0075-collection-association-target-fidelity/replace-records-gate-on-concat-return-not-rollback-catch`,
`.../replace-persisted-guard-diverges-from-rails-array-compare`,
`.../route-inverse-wiring-through-replace-on-target`,
`.../collection-proxy-toarray-caches-target-for-replace`.

## Converged shape

`replace(records)` becomes `this._collectionAssociation().replace(records)`.
The five private helpers are deleted. Any divergence between the two copies is
resolved **in favour of the association copy** (it is the one Rails writes); if
the proxy copy carries behaviour the association's lacks and tests prove it
needed, that behaviour moves into `collection-association.ts` at the Rails name.

## Acceptance criteria

- `replace` in `collection-proxy.ts` is a one-line delegation.
- `_replaceRecords`, `_replaceCommonRecordsInMemory`, `_difference`,
  `_intersection`, `_replaceTransaction` no longer exist in
  `collection-proxy.ts`.
- No new private helper is added there.
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- Existing suites pass unchanged, incl.
  `collection-proxy-replace-diff.trails.test.ts`,
  `has-many-associations.test.ts`, `port-hollow-has-many-replace-tests`
  coverage. No test renamed.
