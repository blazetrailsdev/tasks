---
title: "Converge the 29 activerecord sites that flatten a Rails kwarg to a positional (or vice versa)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 348
priority: null
pr: 6360
claim: "2026-08-11T14:06:07Z"
assignee: "naming-burndown-activesupport-2"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 29 rows across 15 files.

Ruby passes a keyword argument where trails passes a positional, or the reverse (`foreign_key_exists?(from_table, to_table)` vs `foreignKeyExists(fromTable, { toTable: ... })`). Rails' kwarg/positional split is part of the signature; converge each call site and the callee it targets.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `associations/association.ts` `association_scope` → `scope`: Rails (`associations/association.rb`) `(ref:this)` vs trails `(kwargs{klass=ref:klass,owner=ref:owner,reflection=ref:richReflection})`
- `coders/column-serializer.ts` `dump` → `assert_valid_value`: Rails (`coders/column_serializer.rb`) `(ref:object, kwargs{action=str:dump})` vs trails `(ref:object, str:dump)`
- `coders/column-serializer.ts` `load` → `assert_valid_value`: Rails (`coders/column_serializer.rb`) `(ref:object, kwargs{action=str:load})` vs trails `(ref:object, str:load)`
- `connection-adapters/abstract/connection-handler.ts` `establish_connection` → `instrument`: Rails (`connection_adapters/abstract/connection_handler.rb`) `(str:!connection.active_record, ref:payload)` vs trails `(str:!connection.active_record, kwargs{config=ref:configuration,connectionName=ref:poolKey,role=ref:role,shard=ref:shard})`
- `connection-adapters/abstract/schema-statements.ts` `foreign_key_options` → `foreign_key_name`: Rails (`connection_adapters/abstract/schema_statements.rb`) `(ref:fromTable, ref:options)` vs trails `(ref:fromTable, kwargs{column=ref:column})`
- `connection-adapters/abstract/schema-statements.ts` `index_name_for_remove` → `index_name`: Rails (`connection_adapters/abstract/schema_statements.rb`) `(ref:tableName, ref:columnName)` vs trails `(ref:tableName, kwargs{column=ref:columns})`
- `connection-adapters/abstract/schema-statements.ts` `index_name_for_remove` → `index_name`: Rails (`connection_adapters/abstract/schema_statements.rb`) `(ref:tableName, ref:columns)` vs trails `(ref:tableName, kwargs{column=ref:columnNames})`
- `connection-adapters/abstract/schema-statements.ts` `remove_foreign_key` → `foreign_key_exists?`: Rails (`connection_adapters/abstract/schema_statements.rb`) `(ref:fromTable, ref:toTable)` vs trails `(ref:fromTable, kwargs{toTable=ref:toTable})`
- `connection-adapters/postgresql-adapter.ts` `data_source_sql` → `quoted_scope`: Rails (`connection_adapters/postgresql_adapter.rb`) `(ref:name, kwargs{type=ref:type})` vs trails `(ref:name, ref:options)`
- `connection-adapters/postgresql-adapter.ts` `data_source_sql` → `quoted_scope`: Rails (`connection_adapters/postgresql/schema_statements.rb`) `(ref:name, kwargs{type=ref:type})` vs trails `(ref:name, ref:options)`
- `connection-adapters/postgresql/oid/range.ts` `infinity` → `infinity`: Rails (`connection_adapters/postgresql/oid/range.rb`) `(kwargs{negative=ref:negative})` vs trails `(ref:options)`
- `connection-adapters/sqlite3-adapter.ts` `alter_table` → `move_table`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(ref:tableName, ref:alteredTableName, ref:merge)` vs trails `(ref:tableName, ref:alteredTableName, kwargs{rename=ref:rename,temporary=bool:true})`
- `connection-adapters/sqlite3-adapter.ts` `check_constraints` → `new`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(ref:tableName, ref:expression, kwargs{name=ref:name})` vs trails `(ref:tableName, ref:trim, ref:name)`
- `connection-handling.ts` `connected_to_many` → `append_to_connected_to_stack`: Rails (`connection_handling.rb`) `(kwargs{klasses=ref:classes,preventWrites=ref:preventWrites,role=ref:role,shard=ref:shard})` vs trails `(ref:entry)`
- `encryption/cipher/aes256-gcm.ts` `encrypt` → `new`: Rails (`encryption/cipher/aes256_gcm.rb`) `(kwargs{payload=ref:encryptedData})` vs trails `(ref:encrypted)`
- `encryption/scheme.ts` `initialize` → `new`: Rails (`encryption/scheme.rb`) `(kwargs{compress=ref:compress})` vs trails `(ref:encryptor)`
- `relation.ts` `exists?` → `apply_join_dependency`: Rails (`relation.rb`) `(kwargs{eagerLoading=bool:false})` vs trails `(bool:false)`
- `relation.ts` `exists?` → `apply_join_dependency`: Rails (`relation/finder_methods.rb`) `(kwargs{eagerLoading=bool:false})` vs trails `(bool:false)`
- `relation/query-methods.ts` `preprocess_order_args` → `disallow_raw_sql!`: Rails (`relation/query_methods.rb`) `(ref:flattenedArgs, kwargs{permit=ref:columnNameWithOrderMatcher})` vs trails `(ref:keysForCheck, ref:resolveOrderMatcher)`
- `scoping/named.ts` `default_scoped` → `build_default_scope`: Rails (`scoping/named.rb`) `(ref:scope, kwargs{allQueries=ref:allQueries})` vs trails `(ref:this, ref:allQueries)`
- `secure-token.ts` `has_secure_token` → `generate_unique_secure_token`: Rails (`secure_token.rb`) `(kwargs{length=ref:length})` vs trails `(ref:tokenLength)`
- `tasks/database-tasks.ts` `charset_current` → `configs_for`: Rails (`tasks/database_tasks.rb`) `(kwargs{envName=ref:envName,name=ref:dbName})` vs trails `(ref:env)`
- `tasks/database-tasks.ts` `check_protected_environments!` → `configs_for`: Rails (`tasks/database_tasks.rb`) `(kwargs{envName=ref:environment})` vs trails `(ref:envName)`
- `tasks/database-tasks.ts` `collation_current` → `configs_for`: Rails (`tasks/database_tasks.rb`) `(kwargs{envName=ref:envName,name=ref:dbName})` vs trails `(ref:env)`
- `tasks/database-tasks.ts` `dump_schema` → `dump`: Rails (`tasks/database_tasks.rb`) `(ref:migrationConnectionPool, ref:file)` vs trails `(ref:adapter, kwargs{language=ref:language})`
- `tasks/database-tasks.ts` `each_current_configuration` → `configs_for`: Rails (`tasks/database_tasks.rb`) `(kwargs{envName=ref:env})` vs trails `(ref:env)`
- `tasks/database-tasks.ts` `raise_for_multi_db` → `configs_for`: Rails (`tasks/database_tasks.rb`) `(kwargs{envName=ref:environment})` vs trails `(ref:envName)`
- `tasks/database-tasks.ts` `truncate_all` → `configs_for`: Rails (`tasks/database_tasks.rb`) `(kwargs{envName=ref:environment})` vs trails `(ref:env)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
