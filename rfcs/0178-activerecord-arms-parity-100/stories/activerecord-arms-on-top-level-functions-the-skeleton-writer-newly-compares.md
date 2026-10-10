---
title: "activerecord: converge or receipt the arm mismatches on top-level functions the skeleton writer newly compares"
status: in-progress
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#8740
claim: "2026-10-10T01:33:30Z"
assignee: "activerecord-arms-on-top-level-functions-the-skeleton-writer-newly-compares"
blocked-by: null
closed-reason: null
---

## Context

The skeleton writer (`skeletonsOfOwner`, `scripts/api-compare/compare.ts`) dropped every top-level
`export function` that the extractor's synthesized file module re-lists, so these pairs never reached
`pnpm parity:api:arms:report`. The writer fix (story
`skeleton-writer-drops-top-level-functions-relisted-by-the-synthesized-file-module`) grew
`call-skeletons.json` from 7602 rows to 8120, and the pairs below are the newly compared ones the
report files as mismatched. Each line is `<ts file>#<ts name> (<rb file>#<rb name>): <arm diff>`, where
`-token` is an arm Rails takes and the port omits and `+token` is one the port adds. The Ruby paths are
relative to the gem's `lib/<gem>/` under `vendor/rails/v8.0.2/` (or the vendored gem for thor, rack, i18n, pg).

**activerecord** (34)

- `suppressor.ts#suppress (suppressor.rb#suppress)`: `+if`
- `relation/finder-methods.ts#findNth (relation/finder_methods.rb#find_nth)`: `+if`
- `no-touching.ts#applyTo (no_touching.rb#apply_to)`: `+if +rescue +throw`
- `connection-adapters/sqlite3/schema-statements.ts#dataSourceSql (connection_adapters/sqlite3/schema_statements.rb#data_source_sql)`: `+if`
- `relation/finder-methods.ts#raiseRecordNotFoundExceptionBang (relation/finder_methods.rb#raise_record_not_found_exception!)`: `+if +if`
- `querying.ts#findBySql (querying.rb#find_by_sql)`: `+if +if`
- `connection-adapters/sqlite3/quoting.ts#quoteTableName (connection_adapters/sqlite3/quoting.rb#quote_table_name)`: `+if`
- `transactions.ts#rememberTransactionRecordState (transactions.rb#remember_transaction_record_state)`: `+if`
- `relation/finder-methods.ts#findNthWithLimit (relation/finder_methods.rb#find_nth_with_limit)`: `+throw +if`
- `secure-password.ts#authenticateBy (secure_password.rb#authenticate_by)`: `+if`
- `active-record.ts#isSchemaCacheIgnoredTable (active_record.rb#schema_cache_ignored_table?)`: `+if`
- `relation/finder-methods.ts#findSomeOrdered (relation/finder_methods.rb#find_some_ordered)`: `+if`
- `connection-adapters/sqlite3/quoting.ts#quoteColumnName (connection_adapters/sqlite3/quoting.rb#quote_column_name)`: `+if`
- `connection-adapters/sqlite3/quoting.ts#quote (connection_adapters/sqlite3/quoting.rb#quote)`: `+if`
- `transactions.ts#transaction (transactions.rb#transaction)`: `+if +loop +if +throw`
- `relation/finder-methods.ts#takeBang (relation/finder_methods.rb#take!)`: `+if`
- `transactions.ts#setOptionsForCallbacksBang (transactions.rb#set_options_for_callbacks!)`: `+if +if +if`
- `serialization.ts#serializableHash (serialization.rb#serializable_hash)`: `+if +if`
- `no-touching.ts#isAppliedTo (no_touching.rb#applied_to?)`: `+loop +if`
- `relation/finder-methods.ts#constructRelationForExists (relation/finder_methods.rb#construct_relation_for_exists)`: `+if +if`
- `relation/spawn-methods.ts#merge (relation/spawn_methods.rb#merge)`: `+if`
- `querying.ts#asyncFindBySql (querying.rb#async_find_by_sql)`: `+if +if`
- `connection-adapters/sqlite3/database-statements.ts#performQuery (connection_adapters/sqlite3/database_statements.rb#perform_query)`: `+if +if +if`
- `connection-adapters/sqlite3/schema-statements.ts#removeCheckConstraint (connection_adapters/sqlite3/schema_statements.rb#remove_check_constraint)`: `+if +if`
- `relation/finder-methods.ts#findWithIds (relation/finder_methods.rb#find_with_ids)`: `+throw`
- `relation/finder-methods.ts#firstBang (relation/finder_methods.rb#first!)`: `+if`
- `querying.ts#countBySql (querying.rb#count_by_sql)`: `+if`
- `transactions.ts#transaction (transactions.rb#transaction)`: `+if +loop +if +throw`
- `connection-adapters/sqlite3/schema-statements.ts#removeForeignKey (connection_adapters/sqlite3/schema_statements.rb#remove_foreign_key)`: `+if`
- `relation/finder-methods.ts#orderedRelation (relation/finder_methods.rb#ordered_relation)`: `+if +if`
- `connection-adapters/sqlite3/schema-statements.ts#checkConstraints (connection_adapters/sqlite3/schema_statements.rb#check_constraints)`: `+loop +if +if +if`
- `relation/finder-methods.ts#find (relation/finder_methods.rb#find)`: `+if +throw +loop +if +if +if +if +throw`
- `connection-adapters/sqlite3/quoting.ts#typeCast (connection_adapters/sqlite3/quoting.rb#type_cast)`: `+if +if +if`
- `relation/finder-methods.ts#lastBang (relation/finder_methods.rb#last!)`: `+if`

**activerecord-test-support** (5)

- `adapter-helper.ts#sqlite3AdapterStrictStringsDisabled (adapter_helper.rb#sqlite3_adapter_strict_strings_disabled?)`: `+if`
- `load-schema-helper.ts#loadSchema (load_schema_helper.rb#load_schema)`: `-try -if`
- `adapter-helper.ts#mysqlEnforcingGtidConsistency (adapter_helper.rb#mysql_enforcing_gtid_consistency?)`: `+if`
- `ddl-helper.ts#withExampleTable (ddl_helper.rb#with_example_table)`: `+if +if`
- `adapter-helper.ts#inMemoryDb (adapter_helper.rb#in_memory_db?)`: `+if`

**pg** (1)

- `connection.ts#reset (connection.rb#reset)`: `-if +try +rescue +throw`

**arel** (1)

- `arel.ts#sql (arel.rb#sql)`: `+if`

Re-derive the current list with `pnpm tsx scripts/api-compare/report-arms.ts --sample=100000`.

## Acceptance criteria

- [ ] Each pair is converged onto Rails' control flow, or its invented arm carries an
      `@inventedArm <token> — PERMANENT|CONVERGEABLE <story-id>` receipt on the declaration.
- [ ] A row that is a comparer artefact (a mispairing, an idiom fold) is fixed in the comparer, not receipted.
- [ ] `pnpm parity:api:arms:throws` stays green without raising a mark.
