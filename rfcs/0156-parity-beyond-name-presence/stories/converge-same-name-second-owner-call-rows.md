---
title: "converge-same-name-second-owner-call-rows"
status: draft
updated: 2026-09-25
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/compare.ts` counts a Ruby method name once per file
(`seen` / `dedupeRubyMethodInto`), so when two Ruby classes in one `.rb`
declare the same name, only the first-seen owner's body reached the call gates.
`QueryCacheRegistry#compute_if_absent` / `#clear`
(`activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:97-114`)
went uncompared behind `Store`'s (`:40-95`).
The query-cache-registry-unpaired-in-parity-api PR changed the direct-match
arm so every further same-level Ruby owner whose short name the TS file also
declares the member on is run through `checkCalls` against its own body. That
compared 673 more pairs and surfaced 36 pre-existing call-set rows plus one
`rubyCompat` row. They were baselined with a shared reason pointing here:

```text
actiondispatch  journey/gtg/simulator.ts  memos  new
actiondispatch  request/session.ts  id  fetch
actiondispatch  routing/route-set.ts  call  eval_block
actionview  buffers.ts  safe_concat  call
actionview  template/resolver.ts  built_templates  flatten
activerecord  associations/errors.ts  initialize  to_sentence
activerecord  connection-adapters/abstract/connection-pool.ts  remove  bulk_make_new_connections
activerecord  connection-adapters/abstract/connection-pool.ts  remove  remove_connection_from_thread_cache
activerecord  connection-adapters/abstract/query-cache.ts  clear_query_cache  increment
activerecord  connection-adapters/abstract/schema-definitions.ts  export_name_on_schema_dump?  match?
activerecord  connection-adapters/abstract/transaction.ts  after_commit  call
activerecord  connection-adapters/abstract/transaction.ts  after_rollback  call
activerecord  connection-adapters/abstract/transaction.ts  before_commit  call
activerecord  connection-adapters/postgresql/schema-definitions.ts  export_name_on_schema_dump?  match?
activerecord  connection-adapters/schema-cache.ts  columns  deep_deduplicate
activerecord  connection-adapters/schema-cache.ts  columns  fetch
activerecord  connection-adapters/schema-cache.ts  columns_hash  fetch
activerecord  connection-adapters/schema-cache.ts  columns_hash  index_by
activerecord  connection-adapters/schema-cache.ts  data_source_exists?  deep_deduplicate
activerecord  connection-adapters/schema-cache.ts  data_source_exists?  empty?
activerecord  connection-adapters/schema-cache.ts  dump_to  dump
activerecord  connection-adapters/schema-cache.ts  indexes  fetch
activerecord  connection-adapters/schema-cache.ts  primary_keys  deep_deduplicate
activerecord  connection-adapters/schema-cache.ts  primary_keys  fetch
activerecord  errors.ts  set_query  call
activerecord  migration.ts  initialize  create_table
activerecord  statement-cache.ts  initialize  map
activesupport  notifications/fanout.ts  publish  call
activesupport  notifications/fanout.ts  publish_event  call
rack  request.ts  delete_param  delete
rack  request.ts  query_parser  default_query_parser
rack  request.ts  trusted_proxy?  call
rack  request.ts  update_param  has_key?
rack  response.ts  buffered_body!  call
rack  response.ts  buffered_body!  new
rack-session  abstract/id.ts  initialize  delete
rack  request.ts  update_param  has_key? → hasKey  (rubyCompat)
```

The call-ARGUMENT gate (`checkCallArgs`) was deliberately NOT extended to
those owners: doing so surfaces 13 shape rows and 30 `naming` rows in
`NAMING_ENROLLED_PACKAGES`. Most are the `@ivar` vs `this._field` spelling
(`BoundSchemaReflection` `@pool` vs `_pool`, `schema_cache.rb`),
`block` vs `fn` (`transaction.rb` `before_commit` / `after_commit` /
`after_rollback`), and `attribute` vs `attr` in `insert_all.rb#returning`.
Naming rows can't be baselined.

## Acceptance criteria

- Each baselined row above is converged (the TS body makes the Rails call) or
  shown to be a mispairing and fixed in the comparer. The shared reason is then
  replaced row by row, and every converged row is deleted.
- `checkCallArgs` runs for the extra owners too (the second `checkCalls` sibling
  in the direct-match arm of `compare.ts`). Its naming rows are renamed or
  receipted and its shape rows are converged or baselined with reviewed reasons.
