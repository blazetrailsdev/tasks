---
title: "extra-surface: feed Ruby fileConstants into the allowed-name set"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5338
claim: "2026-07-26T02:38:53Z"
assignee: "extra-surface-allow-ruby-file-constants"
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). The story predicted the 30 novel names on
`connection-adapters/abstract-mysql-adapter.ts` were "mostly `ER_*` / `CR_*`
error-code constants — probable allowlist-with-reason candidates". They are
not allowlist candidates: **Rails declares those exact constants, and the
extra-surface allow-set simply never looks at constants.**

`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:793`
declares `ER_DUP_ENTRY = 1062`, `:803` `ER_LOCK_DEADLOCK = 1213`, and the rest
of the block. The Ruby extractor already captures them:
`scripts/api-compare/output/rails-api.json` →
`packages.activerecord.fileConstants["connection_adapters/abstract_mysql_adapter.rb"]`
is `{"ER_DB_CREATE_EXISTS":{"kind":"int","value":"1007"}, "ER_DUP_ENTRY":…}`.
But `collectAllowedNames` (`scripts/api-compare/extra-surface.ts:481-556`)
only unions `instanceMethods` / `classMethods` off entities and walked mixins.
`fileConstants` is never consulted, so a faithfully-ported constant scores as
novel drift.

Confirmed hits (22 novel names that appear verbatim as Rails constants):
17 on `connection-adapters/abstract-mysql-adapter.ts` (`CR_SERVER_GONE_ERROR`,
`CR_SERVER_LOST`, `ER_CLIENT_INTERACTION_TIMEOUT`, `ER_CONNECTION_KILLED`,
`ER_DATA_TOO_LONG`, `ER_DB_CREATE_EXISTS`, `ER_DO_NOT_HAVE_DEFAULT`,
`ER_DUP_ENTRY`, `ER_FILSORT_ABORT`, `ER_LOCK_DEADLOCK`,
`ER_LOCK_WAIT_TIMEOUT`, `ER_NO_REFERENCED_ROW_2`, `ER_NOT_NULL_VIOLATION`,
`ER_OUT_OF_RANGE`, `ER_QUERY_INTERRUPTED`, `ER_QUERY_TIMEOUT`,
`ER_SERVER_SHUTDOWN`), plus `migration.ts:RELEASE_LOCK_FAILED_MESSAGE`,
`connection-adapters/abstract/schema-dumper.ts` and
`schema-dumper.ts`:`DEFAULT_DATETIME_PRECISION`,
`relation/batches.ts:ORDER_IGNORE_MESSAGE`,
`encryption/cipher/aes256-gcm.ts:CIPHER_TYPE`.

A further 18 SCREAMING_CASE novel names are **not** in `fileConstants`, so they
split two ways and need per-name triage:

- Rails declares them but the Ruby extractor's constant capture missed them
  (`rails-api.json` `fileConstants` covers only 23 activerecord files) —
  e.g. `connection-adapters/postgresql-adapter.ts:NATIVE_DATABASE_TYPES`,
  `connection-adapters/sqlite3-adapter.ts:{MAX,MIN}`, `migration.ts:VERSION`,
  `associations/builder/association.ts:VALID_OPTIONS`,
  `relation/batches.ts:DEFAULT_BATCH_SIZE`,
  `log-subscriber.ts:IGNORE_PAYLOAD_NAMES`,
  `explain-subscriber.ts:{EXPLAINED_SQLS,IGNORED_PAYLOADS}`,
  `nested-attributes.ts:REJECT_ALL_BLANK_PROC`.
- Genuine trails inventions to classify separately —
  `connection-adapters/abstract-mysql-adapter.ts:CLIENT_NOT_CONNECTED_RE`,
  `connection-adapters/abstract/connection-pool.ts:NULL_CONFIG`,
  `{connection-adapters/abstract/,}transaction.ts:NULL_TRANSACTION`,
  `associations/{association-scope,disable-joins-association-scope}.ts:INSTANCE`,
  `connection-adapters/postgresql-adapter.ts:TYPE`.

Also check the `Version` name reported on `connection-adapters.ts`,
`abstract-adapter.ts` and `abstract-mysql-adapter.ts` — Rails has
`ActiveRecord::ConnectionAdapters::…::Version` as a class in some adapters,
so it may be a class-vs-constant naming mismatch rather than either bucket.

## Acceptance criteria

- `collectAllowedNames` unions the matched Ruby file's `fileConstants` names
  (mapped through the same `rubyMethodToTs` candidate pipeline, or verbatim
  if constants are not case-transformed) into the allow-set.
- Decide and document whether constants declared in a **different** Rails file
  count as `moved` (consistent with the method rule) — the global
  novel/moved oracle at `extra-surface.ts:560+` must learn constants either
  way, or every constant becomes novel-by-omission again.
- Test in `scripts/api-compare/extra-surface.test.ts` covering: constant
  declared in the matched Ruby file (allowed), constant declared in a
  different Ruby file (moved), TS-only constant (novel).
- Widen the Ruby extractor's constant capture, or file a separate story with
  the 9 confirmed misses listed above if it is out of scope here.
- `pnpm parity:api && pnpm parity:api:extra --package activerecord`: novel drops by
  at least 22; `connection-adapters/abstract-mysql-adapter.ts` drops from 30
  novel to ~13. Record exact numbers.
