---
title: "activerecord: verify and pin the 59 protocol-definition pairs matched since the body-pin floor"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: pins
packages: ["activerecord"]
deps: ["port-hash-eql-rows-surfaced-by-scoring"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` activerecord **pins 4468/4544 (76 unpinned)**. Outside `migration/compatibility.rb`
(`activerecord-verify-and-pin-migration-compatibility`), the unpinned pairs are value-protocol
definitions RFC 0156 enrolled after the `--pin-all` floor:

- `core.rb` — `encode_with`, `hash`, `init_with`, `initialize_dup`, `inspect`, `inspect`, `pretty_print`
- `base.rb` — `current_time_from_proper_timezone`, `encode_with`, `hash`, `inspect`, `pretty_print`
- `connection_adapters/column.rb` — `encode_with`, `hash`, `init_with`
- `connection_adapters/postgresql/column.rb` — `encode_with`, `hash`, `init_with`
- `connection_adapters/schema_cache.rb` — `encode_with`, `init_with`, `initialize_dup`
- `connection_adapters/sqlite3/column.rb` — `encode_with`, `hash`, `init_with`
- `locking/optimistic.rb` — `encode_with`, `init_with`, `initialize_dup`
- `relation.rb` — `initialize_copy`, `inspect`, `pretty_print`
- `associations/collection_proxy.rb` — `inspect`, `pretty_print`
- `associations/preloader/association.rb` — `eql?`, `hash`
- `inheritance.rb` — `dup`, `initialize_dup`
- `aggregations.rb` — `initialize_dup`
- `associations.rb` — `initialize_dup`
- `coders/column_serializer.rb` — `init_with`
- `connection_adapters/abstract_adapter.rb` — `inspect`
- `connection_adapters/abstract/connection_pool.rb` — `inspect`
- `connection_adapters/mysql/type_metadata.rb` — `hash`
- `connection_adapters/postgresql/type_metadata.rb` — `hash`
- `connection_adapters/postgresql/utils.rb` — `hash`
- `connection_adapters/sql_type_metadata.rb` — `hash`
- `database_configurations/connection_url_resolver.rb` — `to_hash`
- `database_configurations/database_config.rb` — `inspect`
- `encryption/cipher/aes256_gcm.rb` — `inspect`
- `encryption/properties.rb` — `to_h`
- `encryption/scheme.rb` — `to_h`
- `fixture_set/table_row.rb` — `to_hash`
- `fixture_set/table_rows.rb` — `to_hash`
- `normalization.rb` — `hash`
- `relation/where_clause.rb` — `to_h`
- `result.rb` — `initialize_copy`
- `timestamp.rb` — `initialize_dup`
- `type/date_time.rb` — `default_timezone`
- `type/date.rb` — `default_timezone`
- `type/time.rb` — `default_timezone`

## Acceptance criteria

- [ ] Each pair is verified line-for-line against its Rails body and fixed where it diverges.
- [ ] `body-pins.ts --pin <ruby-file>` per file with a `reason` naming this story.
- [ ] activerecord unpinned drops by 59.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins
```
