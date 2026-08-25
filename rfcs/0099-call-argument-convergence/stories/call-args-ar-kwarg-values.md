---
title: "Converge the 20 activerecord sites whose kwarg VALUES diverge from Rails"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: 6361
claim: "2026-08-11T14:16:14Z"
assignee: "arel-nodes-manager-residual-classification"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 20 rows across 11 files.

The keys match but the value expressions differ — most often a hard-coded literal where Rails reads a configured value (`role: "writing"` vs `role: ActiveRecord.writing_role`). Pass the value Rails passes.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `connection-adapters/abstract-mysql-adapter.ts` `change_column_null` → `change_column`: Rails (`connection_adapters/abstract_mysql_adapter.rb`) `(ref:tableName, ref:columnName, nil, kwargs{null=ref:null})` vs trails `(ref:tableName, ref:columnName, nil, kwargs{null=ref:null_})`
- `connection-adapters/abstract/connection-handler.ts` `retrieve_connection_pool` → `new`: Rails (`connection_adapters/abstract/connection_handler.rb`) `(ref:message, kwargs{connectionName=ref:connectionName,role=ref:role,shard=ref:shard})` vs trails `(ref:message, kwargs{connectionName=ref:owner,role=ref:role,shard=ref:shard})`
- `connection-adapters/mysql2-adapter.ts` `initialize_type_map` → `lookup`: Rails (`connection_adapters/mysql2_adapter.rb`) `(str:string, kwargs{adapter=str:mysql2,limit=ref:limit})` vs trails `(str:string, kwargs{adapter=str:mysql,limit=ref:limit})`
- `connection-adapters/mysql2-adapter.ts` `initialize_type_map` → `lookup`: Rails (`connection_adapters/mysql2_adapter.rb`) `(str:string, kwargs{adapter=str:mysql2})` vs trails `(str:string, kwargs{adapter=str:mysql})`
- `connection-handling.ts` `connection_pool` → `retrieve_connection_pool`: Rails (`connection_handling.rb`) `(ref:connectionSpecificationName, kwargs{role=ref:currentRole,shard=ref:currentShard,strict=bool:true})` vs trails `(ref:name, kwargs{role=ref:call,shard=ref:call,strict=bool:true})`
- `connection-handling.ts` `remove_connection` → `remove_connection_pool`: Rails (`connection_handling.rb`) `(ref:name, kwargs{role=ref:currentRole,shard=ref:currentShard})` vs trails `(ref:name, kwargs{role=ref:call,shard=ref:call})`
- `connection-handling.ts` `remove_connection` → `retrieve_connection_pool`: Rails (`connection_handling.rb`) `(ref:name, kwargs{role=ref:currentRole,shard=ref:currentShard})` vs trails `(ref:name, kwargs{role=ref:call,shard=ref:call})`
- `connection-handling.ts` `retrieve_connection` → `retrieve_connection`: Rails (`connection_handling.rb`) `(ref:connectionSpecificationName, kwargs{role=ref:currentRole,shard=ref:currentShard})` vs trails `(ref:name, kwargs{role=ref:call,shard=ref:call})`
- `core.ts` `strict_loading_violation!` → `instrument`: Rails (`core.rb`) `(ref:name, kwargs{owner=ref:owner,reflection=ref:reflection})` vs trails `(str:strict_loading_violation.active_record, kwargs{owner=ref:ownerClass,reflection=ref:reflectionLike})`
- `encryption/cipher.ts` `decrypt` → `try_to_decrypt_with_each`: Rails (`encryption/cipher.rb`) `(ref:encryptedMessage, kwargs{keys=ref:Array})` vs trails `(ref:encryptedMessage, kwargs{keys=ref:keys})`
- `encryption/key-generator.ts` `derive_key_from` → `new`: Rails (`encryption/key_generator.rb`) `(ref:password, kwargs{hashDigestClass=ref:hashDigestClass})` vs trails `(ref:password, kwargs{hashDigestClass=ref:_hashDigestClass})`
- `locking/pessimistic.ts` `lock!` → `reload`: Rails (`locking/pessimistic.rb`) `(kwargs{lock=ref:lock})` vs trails `(kwargs{lock=ref:lockClause})`
- `middleware/database-selector/resolver.ts` `read_from_primary` → `connected_to`: Rails (`middleware/database_selector/resolver.rb`) `(kwargs{preventWrites=bool:true,role=ref:writingRole})` vs trails `(kwargs{preventWrites=bool:true,role=str:writing})`
- `middleware/database-selector/resolver.ts` `read_from_replica` → `connected_to`: Rails (`middleware/database_selector/resolver.rb`) `(kwargs{preventWrites=bool:true,role=ref:readingRole})` vs trails `(kwargs{preventWrites=bool:true,role=str:reading})`
- `middleware/database-selector/resolver.ts` `write_to_primary` → `connected_to`: Rails (`middleware/database_selector/resolver.rb`) `(kwargs{preventWrites=bool:false,role=ref:writingRole})` vs trails `(kwargs{preventWrites=bool:false,role=str:writing})`
- `middleware/shard-selector.ts` `set_shard` → `connected_to`: Rails (`middleware/shard_selector.rb`) `(kwargs{shard=ref:toSym})` vs trails `(kwargs{shard=ref:shardKey})`
- `signed-id.ts` `find_signed` → `verified`: Rails (`signed_id.rb`) `(ref:signedId, kwargs{purpose=ref:combineSignedIdPurposes})` vs trails `(ref:token, kwargs{purpose=ref:combinePurposes})`
- `signed-id.ts` `find_signed!` → `verify`: Rails (`signed_id.rb`) `(ref:signedId, kwargs{purpose=ref:combineSignedIdPurposes})` vs trails `(ref:token, kwargs{purpose=ref:combinePurposes})`
- `signed-id.ts` `signed_id` → `generate`: Rails (`signed_id.rb`) `(ref:id, kwargs{expiresAt=ref:expiresAt,expiresIn=ref:expiresIn,purpose=ref:combineSignedIdPurposes})` vs trails `(ref:coerce, kwargs{expiresAt=ref:expiresAt,expiresIn=ref:expiresIn,purpose=ref:combinePurposes})`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
