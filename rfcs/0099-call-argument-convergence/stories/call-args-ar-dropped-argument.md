---
title: "Converge the 46 activerecord call sites that drop an argument Rails passes"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 552
priority: null
pr: 6373
claim: "2026-08-11T18:22:40Z"
assignee: "call-args-ar-dropped-argument"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 46 rows across 27 files.

Each site calls what Rails calls with FEWER arguments — a dropped positional or a dropped kwarg (`async:`, `new_connection: true`, `force: true`, `action:`). Pass what Rails passes at each site; where the callee does not accept the parameter yet, add it with Rails' name and default first.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `associations.ts` `belongs_to` → `build`: Rails (`associations.rb`) `(ref:this, ref:name, ref:scope, ref:options)` vs trails `(ref:this, ref:name, ref:options)`
- `associations.ts` `has_one` → `build`: Rails (`associations.rb`) `(ref:this, ref:name, ref:scope, ref:options)` vs trails `(ref:this, ref:name, ref:options)`
- `associations/belongs-to-association.ts` `replace` → `replace_keys`: Rails (`associations/belongs_to_association.rb`) `(ref:record, kwargs{force=bool:true})` vs trails `(ref:record)`
- `associations/collection-proxy.ts` `delete_all` → `delete_all`: Rails (`associations/collection_proxy.rb`) `(ref:dependent)` vs trails `()`
- `associations/preloader/branch.ts` `preloaders_for_reflection` → `new`: Rails (`associations/preloader/branch.rb`) `(ref:rhsKlass, ref:rs, ref:reflection, ref:scope, ref:reflectionScope, ref:associateByDefault)` vs trails `()`
- `attribute-methods/serialization.ts` `build_column_serializer` → `new`: Rails (`attribute_methods/serialization.rb`) `(ref:attrName, ref:coder, ref:type)` vs trails `(ref:attrName, ref:type)`
- `attribute-methods/time-zone-conversion.ts` `convert_time_to_time_zone` → `map`: Rails (`attribute_methods/time_zone_conversion.rb`) `(ref:value)` vs trails `()`
- `attribute-methods/write.ts` `define_method_attribute=` → `define_attribute_accessor_method`: Rails (`attribute_methods/write.rb`) `(ref:owner, ref:canonicalName, kwargs{writer=bool:true})` vs trails `(ref:canonicalName, bool:true)`
- `attributes.ts` `_default_attributes` → `new`: Rails (`attributes.rb`) `(ref:attributesHash)` vs trails `()`
- `autosave-association.ts` `add_autosave_association_callbacks` → `around_save`: Rails (`autosave_association.rb`) `(str:aroundSaveCollectionAssociation)` vs trails `()`
- `connection-adapters/abstract-adapter.ts` `case_insensitive_comparison` → `lower`: Rails (`connection_adapters/abstract_adapter.rb`) `(ref:value)` vs trails `()`
- `connection-adapters/abstract-adapter.ts` `disconnect!` → `clear_cache!`: Rails (`connection_adapters/abstract_adapter.rb`) `(kwargs{newConnection=bool:true})` vs trails `()`
- `connection-adapters/abstract-adapter.ts` `reconnect!` → `clear_cache!`: Rails (`connection_adapters/abstract_adapter.rb`) `(kwargs{newConnection=bool:true})` vs trails `()`
- `connection-adapters/abstract-adapter.ts` `reset!` → `clear_cache!`: Rails (`connection_adapters/abstract_adapter.rb`) `(kwargs{newConnection=bool:true})` vs trails `()`
- `connection-adapters/abstract-adapter.ts` `select_all` → `empty`: Rails (`connection_adapters/abstract_adapter.rb`) `(kwargs{async=ref:async})` vs trails `()`
- `connection-adapters/abstract-adapter.ts` `select_one` → `select_all`: Rails (`connection_adapters/abstract_adapter.rb`) `(ref:arel, ref:name, ref:binds, kwargs{async=ref:async})` vs trails `(ref:arel, ref:name, ref:binds)`
- `connection-adapters/abstract-adapter.ts` `select_rows` → `select_all`: Rails (`connection_adapters/abstract_adapter.rb`) `(ref:arel, ref:name, ref:binds, kwargs{async=ref:async})` vs trails `(ref:arel, ref:name, ref:binds)`
- `connection-adapters/abstract-adapter.ts` `select_value` → `select_rows`: Rails (`connection_adapters/abstract_adapter.rb`) `(ref:arel, ref:name, ref:binds, kwargs{async=ref:async})` vs trails `(ref:arel, ref:name, ref:binds)`
- `connection-adapters/abstract/connection-handler.ts` `initialize` → `new`: Rails (`connection_adapters/abstract/connection_handler.rb`) `(kwargs{initialCapacity=num:2})` vs trails `()`
- `connection-adapters/abstract/connection-pool.ts` `with_connection` → `release_connection`: Rails (`connection_adapters/abstract/connection_pool.rb`) `(ref:lease)` vs trails `()`
- `connection-adapters/postgresql-adapter.ts` `exec_restart_db_transaction` → `internal_execute`: Rails (`connection_adapters/postgresql_adapter.rb`) `(str:ROLLBACK AND CHAIN, str:TRANSACTION, kwargs{allowRetry=bool:false,materializeTransactions=bool:true})` vs trails `(str:ROLLBACK AND CHAIN, str:TRANSACTION)`
- `connection-adapters/postgresql-adapter.ts` `exec_rollback_db_transaction` → `internal_execute`: Rails (`connection_adapters/postgresql_adapter.rb`) `(str:ROLLBACK, str:TRANSACTION, kwargs{allowRetry=bool:false,materializeTransactions=bool:true})` vs trails `(str:ROLLBACK, str:TRANSACTION)`
- `core.ts` `predicate_builder` → `new`: Rails (`core.rb`) `(ref:this, ref:arelTable)` vs trails `(ref:metadata)`
- `encryption/cipher/aes256-gcm.ts` `decrypt` → `new`: Rails (`encryption/cipher/aes256_gcm.rb`) `(const:CIPHER_TYPE)` vs trails `()`
- `encryption/cipher/aes256-gcm.ts` `generate_deterministic_iv` → `digest`: Rails (`encryption/cipher/aes256_gcm.rb`) `(ref:constructor, ref:secret, ref:clearText)` vs trails `()`
- `encryption/derived-secret-key-provider.ts` `initialize` → `derive_key_from`: Rails (`encryption/derived_secret_key_provider.rb`) `(ref:password, kwargs{using=ref:keyGenerator})` vs trails `(ref:p)`
- `encryption/key.ts` `derive_from` → `new`: Rails (`encryption/key.rb`) `(ref:secret)` vs trails `()`
- `encryption/message.ts` `initialize` → `new`: Rails (`encryption/message.rb`) `(ref:headers)` vs trails `()`
- `internal-metadata.ts` `delete_all_entries` → `new`: Rails (`internal_metadata.rb`) `(ref:arelTable)` vs trails `()`
- `internal-metadata.ts` `update_entry` → `new`: Rails (`internal_metadata.rb`) `(ref:arelTable)` vs trails `()`
- `migration.ts` `validate` → `new`: Rails (`migration.rb`) `(ref:name)` vs trails `()`
- `migration.ts` `with_advisory_lock` → `new`: Rails (`migration.rb`) `(const:RELEASE_LOCK_FAILED_MESSAGE)` vs trails `()`
- `reflection.ts` `join_scope` → `join_scopes`: Rails (`reflection.rb`) `(ref:table, ref:predicateBuilder)` vs trails `(ref:table)`
- `reflection.ts` `join_scope` → `klass_join_scope`: Rails (`reflection.rb`) `(ref:table, ref:predicateBuilder)` vs trails `(ref:table)`
- `relation.ts` `distinct` → `distinct!`: Rails (`relation.rb`) `(ref:value)` vs trails `()`
- `relation.ts` `distinct` → `distinct!`: Rails (`relation/query_methods.rb`) `(ref:value)` vs trails `()`
- `relation.ts` `size` → `count`: Rails (`relation.rb`) `(str:all)` vs trails `()`
- `relation.ts` `update` → `update`: Rails (`relation.rb`) `(ref:id, ref:attributes)` vs trails `(ref:updates)`
- `relation.ts` `update!` → `update!`: Rails (`relation.rb`) `(ref:id, ref:attributes)` vs trails `(ref:updates)`
- `relation/predicate-builder.ts` `initialize` → `new`: Rails (`relation/predicate_builder.rb`) `(ref:this)` vs trails `()`
- `schema-migration.ts` `delete_version` → `new`: Rails (`schema_migration.rb`) `(ref:arelTable)` vs trails `()`
- `statement-cache.ts` `create` → `new`: Rails (`statement_cache.rb`) `(ref:queryBuilder, ref:bindMap, ref:model)` vs trails `(ref:normalizedBinds)`
- `tasks/database-tasks.ts` `dump_schema` → `schema_dump_path`: Rails (`tasks/database_tasks.rb`) `(ref:dbConfig, ref:format)` vs trails `(ref:config)`
- `tasks/database-tasks.ts` `reconstruct_from_schema` → `with_temporary_pool`: Rails (`tasks/database_tasks.rb`) `(ref:dbConfig, kwargs{clobber=bool:true})` vs trails `(ref:config)`
- `type/serialized.ts` `assert_valid_value` → `assert_valid_value`: Rails (`type/serialized.rb`) `(ref:value, kwargs{action=str:serialize})` vs trails `(ref:value)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
