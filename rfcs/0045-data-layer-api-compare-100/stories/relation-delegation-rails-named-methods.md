---
title: "relation-delegation-rails-named-methods"
status: claimed
updated: 2026-06-29
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-06-29T20:08:41Z"
assignee: "relation-delegation-rails-named-methods"
blocked-by: null
---

## Context

`ActiveRecord::Delegation` delegates a curated set of methods to `records` and
`model` under their exact Rails names (`relation/delegation.rb:101-106`):

- `to: :records` — `to_xml, encode_with, length, each, join, intersect?, [], &,
|, +, -, sample, reverse, rotate, compact, in_groups, in_groups_of,
to_sentence, to_fs, to_formatted_s, as_json, shuffle, split, slice, index,
rindex`
- `to: :model` — `primary_key, with_connection, connection, table_name,
transaction, sanitize_sql_like, unscoped, name`

trails realizes these through the runtime delegation Proxy in
`relation/delegation.ts` (`delegateArrayMethod` / `delegateEnumerableMethod`
route through native JS names like `forEach`/`indexOf`; `classMethodDelegator`
for the model set), and deliberately drops the Ruby-only entries (`sample`,
`rotate`, `in_groups`, `to_sentence`, `to_fs`, `as_json`, …). PR #4051 scope-
skips these names in `SCOPED_SKIP_GROUPS`. For Rails fidelity the goal is to
expose them under their Rails names so `relation.each`, `relation.connection`,
`relation.to_sentence`, etc. work as in Rails.

## Acceptance criteria

- Expose the `to: :records` and `to: :model` delegations as real methods under
  their Rails names where TypeScript can (e.g. `each`, `join`, `reverse`,
  `slice`, `index`, `connection`, `table_name`, `transaction`, `primary_key`).
- For Ruby-only methods (`to_sentence`, `to_fs`, `to_formatted_s`, `as_json`,
  `in_groups`, `in_groups_of`, `sample`, `rotate`, `shuffle`, `split`,
  `rindex`, `to_xml`): port against the corresponding ActiveSupport/Enumerable
  helpers, or record a per-name justification of a true TS impossibility —
  do NOT leave them as a blanket scoped skip.
- Remove the corresponding entries from `SCOPED_SKIP_GROUPS` as each name lands;
  relation.rb / relation/delegation.rb stay at 100% api:compare; no
  test:compare regression.
