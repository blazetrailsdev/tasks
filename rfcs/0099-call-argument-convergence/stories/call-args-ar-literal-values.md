---
title: "Converge the 12 activerecord call sites passing a different literal than Rails"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6356
claim: "2026-08-11T13:26:07Z"
assignee: "naming-burndown-activerecord-rest-2"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 12 rows across 10 files.

The argument count matches but a literal differs — case (`"deferred"` vs `"DEFERRED"`), a constant substituted for the Rails expression, or an argument order swap. Pass Rails' literal at each site.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `associations/alias-tracker.ts` `create` → `new`: Rails (`associations/alias_tracker.rb`) `(num:0)` vs trails `(ref:aliases)`
- `attribute-methods/read.ts` `define_method_attribute` → `define_attribute_accessor_method`: Rails (`attribute_methods/read.rb`) `(ref:owner, ref:canonicalName)` vs trails `(ref:canonicalName, bool:false)`
- `autosave-association.ts` `define_autosave_validation_callbacks` → `after_validation`: Rails (`autosave_association.rb`) `(str:_ensure_no_duplicate_errors)` vs trails `(ref:klass)`
- `connection-adapters/abstract/connection-pool/queue.ts` `with_a_bias_for` → `new`: Rails (`connection_adapters/abstract/connection_pool/queue.rb`) `(ref:lock, ref:cond, ref:thread)` vs trails `(nil, ref:_cond, ref:context)`
- `connection-adapters/postgresql/referential-integrity.ts` `check_all_foreign_keys_valid!` → `execute`: Rails (`connection_adapters/postgresql/referential_integrity.rb`) `(ref:sql)` vs trails `(const:CHECK_ALL_FOREIGN_KEYS_SQL)`
- `connection-adapters/sqlite3-adapter.ts` `begin_db_transaction` → `internal_begin_transaction`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(str:immediate, nil)` vs trails `(str:IMMEDIATE, nil)`
- `connection-adapters/sqlite3-adapter.ts` `begin_isolated_db_transaction` → `internal_begin_transaction`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(str:deferred, ref:isolation)` vs trails `(str:DEFERRED, ref:isolation)`
- `relation.ts` `current_scope_restoring_block` → `current_scope`: Rails (`relation.rb`) `(bool:true)` vs trails `(ref:modelClass)`
- `tasks/database-tasks.ts` `initialize_database` → `load_schema`: Rails (`tasks/database_tasks.rb`) `(ref:dbConfig, ref:schemaFormat, nil)` vs trails `(ref:dbConfig, ref:schemaFormat, ref:resolved)`
- `testing/query-assertions.ts` `assert_queries_count` → `subscribed`: Rails (`testing/query_assertions.rb`) `(ref:counter, str:sql.active_record)` vs trails `(str:sql.active_record, ref:fn)`
- `testing/query-assertions.ts` `assert_queries_match` → `subscribed`: Rails (`testing/query_assertions.rb`) `(ref:counter, str:sql.active_record)` vs trails `(str:sql.active_record, ref:fn)`
- `type.ts` `current_adapter_name` → `adapter_name_from`: Rails (`type.rb`) `(const:Base)` vs trails `(ref:base)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
