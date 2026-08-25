---
title: "Converge the 17 activerecord sites whose kwarg KEY SET differs from Rails"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 204
priority: null
pr: 6370
claim: "2026-08-11T17:44:26Z"
assignee: "pg-reset-body-under-one-lock"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 17 rows across 8 files.

The site passes a keyword hash whose keys differ from Rails' — an added key (`cause:`, `typeCaster:`, `adapterFactory:`) or a missing one (`allow_retry:`, `binds:`, `sql:`). Every added key is invented surface and every missing one is a dropped Rails behaviour; converge the key set at each site.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `connection-adapters/sqlite3-adapter.ts` `commit_db_transaction` → `internal_execute`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(str:COMMIT TRANSACTION, str:TRANSACTION, kwargs{allowRetry=bool:true,materializeTransactions=bool:false})` vs trails `(str:COMMIT TRANSACTION, str:TRANSACTION, kwargs{materializeTransactions=bool:false})`
- `connection-adapters/sqlite3-adapter.ts` `internal_begin_transaction` → `internal_execute`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(str:PRAGMA read_uncommitted=ON, str:TRANSACTION, kwargs{allowRetry=bool:true,materializeTransactions=bool:false})` vs trails `(str:PRAGMA read_uncommitted=ON, str:TRANSACTION, kwargs{materializeTransactions=bool:false})`
- `connection-adapters/sqlite3-adapter.ts` `translate_exception` → `new`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(ref:message, kwargs{binds=ref:binds,connectionPool=ref:pool,sql=ref:sql})` vs trails `(ref:message, kwargs{binds=ref:binds,cause=ref:exception,connectionPool=ref:connectionPool,sql=ref:sql})`
- `connection-adapters/sqlite3-adapter.ts` `translate_exception` → `new`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(ref:exception, kwargs{connectionPool=ref:pool})` vs trails `(ref:message, kwargs{binds=ref:binds,cause=ref:exception,connectionPool=ref:connectionPool,sql=ref:sql})`
- `connection-adapters/sqlite3-adapter.ts` `translate_exception` → `new`: Rails (`connection_adapters/sqlite3_adapter.rb`) `(ref:message, kwargs{binds=ref:binds,connectionPool=ref:pool,sql=ref:sql})` vs trails `(ref:message, kwargs{cause=ref:exception,connectionPool=ref:connectionPool})`
- `core.ts` `arel_table` → `new`: Rails (`core.rb`) `(ref:tableName, kwargs{klass=ref:this})` vs trails `(ref:tableName, kwargs{klass=ref:this,typeCaster=ref:constructor})`
- `encryption/encrypted-attribute-type.ts` `build_previous_types_for` → `new`: Rails (`encryption/encrypted_attribute_type.rb`) `(kwargs{previousType=bool:true,scheme=ref:scheme})` vs trails `(kwargs{castType=ref:castType,default=ref:_default,previousType=bool:true,scheme=ref:s})`
- `encryption/envelope-encryption-key-provider.ts` `decrypt_data_key` → `decrypt`: Rails (`encryption/envelope_encryption_key_provider.rb`) `(ref:encryptedDataKey, kwargs{key=ref:key})` vs trails `(ref:encryptedDataKey, kwargs{keyProvider=ref:primaryKeyProvider})`
- `encryption/scheme.ts` `initialize` → `new`: Rails (`encryption/scheme.rb`) `(kwargs{compressor=ref:compressor})` vs trails `(kwargs{compress=ref:compress,compressor=ref:compressor})`
- `migration/pending-migration-connection.ts` `with_temporary_pool` → `establish_connection`: Rails (`migration/pending_migration_connection.rb`) `(ref:dbConfig, kwargs{ownerName=ref:this})` vs trails `(ref:dbConfig, kwargs{owner=ref:name})`
- `relation.ts` `find_in_batches` → `in_batches`: Rails (`relation.rb`) `(kwargs{cursor=ref:cursor,errorOnIgnore=ref:errorOnIgnore,finish=ref:finish,load=bool:true,of=ref:batchSize,order=ref:order,start=ref:start})` vs trails `(kwargs{batchSize=ref:batchSize,cursor=ref:cursor,errorOnIgnore=ref:errorOnIgnore,finish=ref:finish,load=bool:true,order=ref:order,start=ref:start})`
- `relation.ts` `find_in_batches` → `in_batches`: Rails (`relation/batches.rb`) `(kwargs{cursor=ref:cursor,errorOnIgnore=ref:errorOnIgnore,finish=ref:finish,load=bool:true,of=ref:batchSize,order=ref:order,start=ref:start})` vs trails `(kwargs{batchSize=ref:batchSize,cursor=ref:cursor,errorOnIgnore=ref:errorOnIgnore,finish=ref:finish,load=bool:true,order=ref:order,start=ref:start})`
- `relation.ts` `insert_all!` → `execute`: Rails (`relation.rb`) `(ref:this, ref:attributes, kwargs{onDuplicate=str:raise,recordTimestamps=ref:recordTimestamps,returning=ref:returning})` vs trails `(ref:this, ref:records, kwargs{recordTimestamps=ref:recordTimestamps,returning=ref:returning})`
- `tasks/database-tasks.ts` `with_temporary_pool` → `establish_connection`: Rails (`tasks/database_tasks.rb`) `(ref:dbConfig, kwargs{clobber=ref:clobber})` vs trails `(ref:config, kwargs{clobber=ref:clobber,owner=ref:connectionClassForSelf})`
- `tasks/database-tasks.ts` `with_temporary_pool` → `establish_connection`: Rails (`tasks/database_tasks.rb`) `(ref:originalDbConfig, kwargs{clobber=ref:clobber})` vs trails `(ref:originalDbConfig, kwargs{clobber=ref:clobber,owner=ref:connectionClassForSelf})`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
