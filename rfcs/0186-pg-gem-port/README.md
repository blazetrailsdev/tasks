---
rfc: "0186-pg-gem-port"
title: "pg: a @blazetrails/pg gem wrapper over node-pg"
status: postponed
created: 2026-10-08
updated: 2026-10-08
owner: "@deanmarano"
packages:
  - pg
  - activerecord
  - "scripts"
  - website
clusters:
  - scoring
  - package
  - connection
  - result-and-coders
  - migration
related-rfcs:
  - "0180-activerecord-receipt-parity"
  - "0184-msgpack-gem-port"
  - "0013-pg-rawconn-convergence"
  - "0187-sqlite3-gem-port"
---

# RFC 0186 — pg gem wrapper

## Summary

Rails' PostgreSQL adapter is written against the `pg` gem: `gem "pg", "~> 1.1"; require "pg"`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:3-4`),
resolved to 1.5.9 (`vendor/rails/v8.0.2/Gemfile.lock:412`). trails carries the gem surface the adapter
calls inside activerecord. This RFC moves that surface into its own package, `@blazetrails/pg`,
wrapping the `pg` npm client as `packages/bcrypt` wraps `bcryptjs` and `packages/msgpack` wraps
`@msgpack/msgpack`. The package is scored the way msgpack is: `parity:api` sees the gem's Ruby
`def`s, and the 39 of 48 called methods the gem defines in C are unscored. No scoring tooling is
built here.

## Motivation

trails#8687 landed after this section was measured: the gem is vendored at `vendor/pg/v1.5.9`,
`pg` is an api-compare package nested at `packages/activerecord/src/pg/`, and
`postgresql/pg-connection.ts` is now `src/pg/connection.ts`. The line citations for that file below
predate the move; the story that touches each one re-reads it.

As measured (`packages/activerecord/src/connection-adapters/`):

- `postgresql/pg-connection.ts` (153 lines) assigns `prepare`, `execPrepared`, `asyncExec`,
  `execParams`, `unescapeBytea` and `socketIo` onto a `pg.Client` with `Object.assign` (`:144-153`).
- `postgresql-adapter.ts:1645-1664` (`_attachReadyForQueryListener`) assigns `transactionStatus`,
  `status`, `cancel` and `block` onto the same client; `_cancel` (`:1675`) and
  `_blockUntilCommandSettles` (`:1703`) are the bodies.
- `postgresql/quoting.ts:50-53` is `PQescapeByteaConn` inline; `postgresql/utils.ts:20` is
  `PG::Connection.quote_ident` inline.
- `postgresql/pg-result.ts` is `PG::Result` as an `Array` subclass; `postgresql/oid/array.ts:20-60` is
  `PG::TextEncoder::Array` / `PG::TextDecoder::Array` under invented names.
- `PQTRANS_*` and `CONNECTION_*` are re-declared as local consts twice
  (`postgresql-adapter.ts:144-150`, `postgresql/database-statements.ts:253-255`).

That is 20 `@noRailsEquivalent CONVERGEABLE` receipts (2 in `pg-connection.ts`, 12 in `pg-result.ts`,
6 in `oid/array.ts`) pointing at two RFC 0180 stories, plus surface that carries no receipt only
because it is assigned at run time and the extractor cannot see it.

The three reasons for a package, tested against what is in the tree:

1. **Adapter bodies read like Rails.** Holds, with one exception recorded as open question 2.
   `perform_query` already reads `rawConnection.execParams(sql, typeCastedBinds)`; what does not is
   everything reached through `_attachReadyForQueryListener`, the constants, and both escapers.
2. **One home, receipts gone.** Holds because the package is ungated, as msgpack is: a receipt is
   deleted by the story that moves its member, and nothing asks for one in `packages/pg`. The C
   surface is then credited by nothing, which is the cost recorded in § Scoring.
3. **A second client can implement the same surface.** Holds in principle, and is why
   `PG::Connection` keeps a private engine boundary (§ Package shape). No second client is planned
   in this RFC.

Four blocked stories are the npm client's shape leaking into the adapter. They are listed against
the method they concern in the surface table; the wrapper is where each is fixed or proven
unfixable, once, instead of per adapter body.

## Design

### Scoring: what `parity:api` does with a C extension today

Measured on `origin/main` at `e8f1bb88fa`, after `pnpm build`:

- `scripts/api-compare/extract-ruby-api.rb` globs `**/*.rb` under each vendored package's `libPath`.
  **Nothing in `scripts/` reads `rb_define_method`, `rb_define_singleton_method`, `rb_define_alias`
  or `rb_define_private_method`.** The only occurrence of `rb_define` under `scripts/` is a comment
  in `enumerable-idioms.ts`. A gem's `ext/` directory is invisible.
- **bcrypt** scores 18/18 because `lib/bcrypt/*.rb` is the whole public surface; the C side
  (`ext/mri/bcrypt_ext.c`'s `__bc_salt` / `__bc_crypt`) is private and unscored.
- **msgpack** scores 34/34 of the Ruby `def`s. The C-defined surface (`ext/msgpack/packer_class.c`,
  `unpacker_class.c`, `buffer_class.c`) is **41 novel and 32 moved names** of extra surface in
  `packer.ts`, `unpacker.ts`, `buffer.ts`, `extension-value.ts` and `factory.ts`
  (`pnpm parity:api:extra --package msgpack`). msgpack is not in `GATED_PACKAGES`, so nothing gates
  it and it carries no receipts. Those methods are credited by nothing.
- **date** is `compareApi: false` (`vendor/sources.ts`, the `date-c-source-extractor-decision`
  spike: 12 Ruby methods against 2,805 lines of port). The gem's test suite is its only measure.
- **sqlite3** is a parity package nested at `packages/activerecord/src/sqlite/`: 229/303, files 3/7.
  Its C surface is receipted `CONVERGEABLE` onto an RFC 0180 story.
- **ruby-compat** is the one model that covers C: a resolved `vendor/ruby/<version>/<file>:<line>`
  citation per export (`eslint/ruby-compat-needs-mri-citation.mjs`) plus a
  `@noRailsEquivalent PERMANENT` receipt, with `parity:api` permanently not enrolled (README rule 3).

**So no existing mechanism scores a TypeScript wrapper against a C-defined gem surface**, and this
RFC does not build one (owner decision, 2026-10-08). `packages/pg` takes the msgpack shape:

- `vendor/sources.ts` enrolls `libPath: "lib/pg"` only. `parity:api` scores the Ruby-defined
  methods, 9 of the 48 by the hand count below.
- The C-defined methods keep their gem names and are reported by `pnpm parity:api:extra --package pg`
  as extra surface. They carry no receipt and no citation.
- `pg` is not added to `GATED_PACKAGES`, so no ratchet reads that surface.
- **The denominator is what activerecord calls, and nothing else** (owner, 2026-10-08). A gem file
  with no member in the surface tables (`basic_type_registry.rb`, `tuple.rb`, the binary coders) is
  an `UNPORTED_FILES` row; a Ruby-defined method in an enrolled file that activerecord does not call
  is a `SCOPED_SKIP_GROUPS` entry. Both carry the reason "not called by activerecord". The `pg` row
  then reads N/N over the Ruby-defined methods of the surface tables, where it reads 1/89 today.

What checks the wrapper instead is the PostgreSQL adapter's own suite, which already passes, and
the gem specs ported under open question 6. A misnamed C-defined method is caught by the adapter
body that calls it failing to compile, not by a parity gate.

#### The measured split

Gem source: `ged/ruby-pg` at tag `v1.5.9` (`afe2f208f7d5`), the version
`vendor/rails/v8.0.2/Gemfile.lock:412` resolves. Of the gem methods the adapter calls:

| class                   | defined in C                                                                                   | defined in Ruby                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `PG` / `PG::Connection` | 23                                                                                             | 4 (`PG.connect`, `cancel`, `reset`, `conndefaults_hash`)                                      |
| `PG::Result`            | 10                                                                                             | 1 (`map_types!`)                                                                              |
| coders and type maps    | 6 (`Coder#name`, `#oid`, `#encode`, `#decode`, `TypeMapByClass#[]=`, `TypeMapByOid#add_coder`) | 4 (`Coder#initialize`, `TimestampUtc#initialize`, `TimestampLocal#initialize`, `Date#decode`) |
| **total**               | **39**                                                                                         | **9**                                                                                         |

**What the 48 counts.** Methods only, one per row-member of the three surface tables below: 27 on
`PG` / `PG::Connection` (a singleton and an instance method of the same name are two), 11 on
`PG::Result`, 10 on the coders and type maps. It does not count classes, constants or error
classes, which `parity:api` scores on other axes (files, inheritance, constants):

- 21 classes and modules: `PG`, `PG::Constants`, `Connection`, `Result`, `Coder`, `SimpleDecoder`,
  `TypeMapByClass`, `TypeMapByOid` (8), 3 text encoders, 7 C-defined text decoders, and 3
  Ruby-defined decoder classes (`TimestampUtc`, `TimestampLocal`, `Date`).
  `TimestampWithoutTimeZone` and `TimestampWithTimeZone` are constant aliases
  (`lib/pg/text_decoder/timestamp.rb:27-28`), not classes.
- 8 constants Rails names, all C (`ext/pg.c`), plus 2 that Rails does not name but the wrapped
  methods return: `PQTRANS_ACTIVE` from `transaction_status` and `CONNECTION_BAD` from `status`
  (`postgresql-adapter.ts:145,150` today). Ten in the package.
- 5 error classes: the 3 Rails names (`PG::Error`, `ConnectionBad`, `FeatureNotSupported`) and
  `ServerError` and `UnableToSend`, which the wrapper raises and the first of which is
  `FeatureNotSupported`'s superclass.

The 48 is a hand count from reading the gem. It is the package's intended surface, and nothing
gates on it. Of the error classes, `PG::Error` is
defined in both (`ext/pg_errors.c:78`, `lib/pg/exceptions.rb:9`); `PG::ConnectionBad`
(`pg_errors.c:89`) and `PG::FeatureNotSupported` (`errorcodes.def:49`) are C.

### The surface

"Only what trails calls" (`packages/ruby-compat/README.md` rule 1): this table is the whole package.
Rails paths are under `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/`;
gem paths are under `vendor/pg/v1.5.9/` once vendored; trails paths are under
`packages/activerecord/src/connection-adapters/`.

#### `PG` and `PG::Connection`

| gem member                                        | Rails call site                                                          | gem definition                  | trails today                                                                                                               | node-pg                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `PG.connect`                                      | `postgresql_adapter.rb:58`                                               | Ruby `lib/pg.rb:62`             | `postgresql-adapter.ts:244-245` `new pg.Client`                                                                            | `new Client(config)` + `connect()`                                                       |
| `Connection.conndefaults_hash`                    | `postgresql_adapter.rb:330`                                              | Ruby `lib/pg/connection.rb:337` | a hard-coded allowlist behind `_sliceValidConnParams` (`postgresql-adapter.ts:1509`)                                       | none; `pg-connection-string` defaults are the nearest                                    |
| `Connection.quote_ident`                          | `postgresql/quoting.rb:47`, `postgresql/utils.rb:24,26`                  | C `ext/pg_connection.c:4489`    | inline lambda `postgresql/utils.ts:20`; `quoting.ts`                                                                       | `escapeIdentifier` (same output for a string)                                            |
| `Connection.unescape_bytea`                       | `postgresql/oid/bytea.rb:11`                                             | C `pg_connection.c:4487`        | `postgresql/pg-connection.ts:99`                                                                                           | none; hand-decoded                                                                       |
| `#escape_bytea`                                   | `postgresql/quoting.rb:71`                                               | C `pg_connection.c:4560`        | inline `postgresql/quoting.ts:50-53`, takes no connection                                                                  | none; hand-encoded                                                                       |
| `#unescape_bytea`                                 | `postgresql/quoting.rb:78`                                               | C `pg_connection.c:4561`        | `pg-connection.ts:99`, installed `:150`                                                                                    | none                                                                                     |
| `#escape`                                         | `postgresql/quoting.rb:129`                                              | C alias `pg_connection.c:4557`  | open-coded in `quoteString`, receipt `postgresql/quoting.ts:111`                                                           | none (`escapeLiteral` adds the quotes)                                                   |
| `#exec_params`                                    | `postgresql/database_statements.rb:162`                                  | C `pg_connection.c:4541`        | `pg-connection.ts:79-91`                                                                                                   | `query({text, values, rowMode})`                                                         |
| `#async_exec`                                     | `postgresql/database_statements.rb:160`                                  | C alias `pg_connection.c:4547`  | `pg-connection.ts:71-77`                                                                                                   | `query(text)`                                                                            |
| `#query`                                          | `postgresql_adapter.rb:313,351,376,378`                                  | C alias `pg_connection.c:4548`  | `rawConnection.query(...)` straight on node-pg (`postgresql-adapter.ts:659`)                                               | same name, different result type                                                         |
| `#prepare`                                        | `postgresql_adapter.rb:925`                                              | C `pg_connection.c:4542`        | `pg-connection.ts:32-52`, a hand-built submittable                                                                         | no public API; `connection.parse`                                                        |
| `#exec_prepared`                                  | `postgresql/database_statements.rb:141`                                  | C `pg_connection.c:4543`        | `pg-connection.ts:54-69`                                                                                                   | `query({name, text, values})`                                                            |
| `#get_last_result`                                | `postgresql_adapter.rb:930`                                              | C `pg_connection.c:4616`        | absent; `prepare` resolves on ReadyForQuery                                                                                | none                                                                                     |
| `#transaction_status`                             | `postgresql/database_statements.rb:128`, `postgresql_adapter.rb:375,850` | C `pg_connection.c:4519`        | assigned `postgresql-adapter.ts:1647-1658` from `_activeQuery` and ReadyForQuery                                           | none; private `_activeQuery`, `readyForQuery` event                                      |
| `#status`                                         | `postgresql_adapter.rb:313`                                              | C `pg_connection.c:4518`        | assigned `postgresql-adapter.ts:1659-1662` from `_ending` / `_ended`                                                       | none                                                                                     |
| `#cancel`                                         | `postgresql/database_statements.rb:130`                                  | Ruby `lib/pg/connection.rb:597` | assigned `:1663`, body `_cancel` `:1675-1701`                                                                              | none on `Client`; `new pg.Connection().cancel(pid, key)`                                 |
| `#block`                                          | `postgresql/database_statements.rb:131`                                  | C `pg_connection.c:4610`        | assigned `:1664`, body `_blockUntilCommandSettles` `:1703`                                                                 | none                                                                                     |
| `#finished?`                                      | `postgresql_adapter.rb:344`                                              | C `pg_connection.c:4499`        | absent; `active?` reads other state                                                                                        | private `_ended`                                                                         |
| `#close`                                          | `postgresql_adapter.rb:389`                                              | C alias `pg_connection.c:4504`  | `_rawConnection.end()` `:703`                                                                                              | `end()`                                                                                  |
| `#socket_io`                                      | `postgresql_adapter.rb:396`                                              | C `pg_connection.c:4525`        | `pg-connection.ts:128-141`                                                                                                 | `connection.stream`                                                                      |
| `#reset`                                          | `postgresql_adapter.rb:946`                                              | Ruby `lib/pg/connection.rb:575` | absent; reconnect builds a new client                                                                                      | none; a `Client` cannot reconnect                                                        |
| `#server_version`                                 | `postgresql_adapter.rb:637`                                              | C `pg_connection.c:4522`        | `_serverVersion` `:1789`, a `SHOW` query                                                                                   | `parameterStatus` event on `client.connection`; `pg/lib/client.js` (8.19) never reads it |
| `#set_client_encoding`                            | `postgresql_adapter.rb:960`                                              | C `pg_connection.c:4607`        | `SET client_encoding TO ...` through `escapeLiteral`, `postgresql-adapter.ts:1333`                                         | `query("SET client_encoding")`                                                           |
| `#set_notice_receiver`                            | `postgresql_adapter.rb:966`                                              | C `pg_connection.c:4601`        | `removeAllListeners("notice")` + `on("notice")` pushing to `_noticeReceiverSqlWarnings`, `postgresql-adapter.ts:1343-1350` | `client.on("notice")`                                                                    |
| `#type_map_for_queries=`                          | `postgresql_adapter.rb:1090`                                             | C `pg_connection.c:4669`        | absent; binds cast in the adapter                                                                                          | per-query `types`                                                                        |
| `#type_map_for_results=`, `#type_map_for_results` | `postgresql_adapter.rb:1100,1141`                                        | C `pg_connection.c:4671-4672`   | `_typeMapForResults` `Map` on the adapter `:427`; `getTypeParser` closure `:570-622`                                       | `types.getTypeParser`                                                                    |

#### `PG::Result`

| gem member                            | Rails call site                                            | gem definition                             | trails today                                                                                    | node-pg                                                           |
| ------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `#fields`                             | `postgresql/database_statements.rb:172,178`                | C `ext/pg_result.c:1746`                   | `postgresql/pg-result.ts:25`                                                                    | `result.fields[].name`                                            |
| `#values`                             | `database_statements.rb:16,184`                            | C `pg_result.c:1748`                       | `pg-result.ts:30`                                                                               | `rows` under `rowMode: "array"`                                   |
| `#ftype`, `#fmod`                     | `database_statements.rb:180-181`                           | C `pg_result.c:1730-1731`                  | `pg-result.ts:45,50`                                                                            | `fields[].dataTypeID`, `dataTypeModifier`                         |
| `#cmd_tuples`                         | `database_statements.rb:190`                               | C `pg_result.c:1739`                       | `pg-result.ts:55`                                                                               | `rowCount`                                                        |
| `#clear`                              | `database_statements.rb:173,185,191`                       | C `pg_result.c:1716`                       | `pg-result.ts:75`                                                                               | none (GC)                                                         |
| `#getvalue`                           | `postgresql_adapter.rb:1080`                               | C `pg_result.c:1733`                       | `pg-result.ts:40`                                                                               | `rows[r][c]`                                                      |
| `#each` (for `count`, `filter_map`)   | `database_statements.rb:167`, `postgresql_adapter.rb:1137` | C `pg_result.c:1745`, `Enumerable` `:1701` | the `Array` superclass and `[Symbol.species]` `pg-result.ts:5-11`                               | `rows`                                                            |
| `#map_types!`                         | `database_statements.rb:16`                                | Ruby `lib/pg/result.rb:16`                 | `pg-result.ts:60`                                                                               | none                                                              |
| `#error_field`, `#result_error_field` | `postgresql_adapter.rb:804,902-903,967-969`                | C `pg_result.c:1714-1715`                  | absent; the adapter reads `error.code`. **Blocked: `pg-translate-exception-respond-to-result`** | `DatabaseError` fields (`code`, `routine`, `severity`, `message`) |

#### Coders and type maps

| gem member                                                                                   | Rails call site                             | gem definition                                                | trails today                                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PG::TextEncoder::Array`, `#encode`                                                          | `postgresql/oid/array.rb:19,50`             | C `ext/pg_text_encoder.c:828`, `ext/pg_coder.c:475`           | `PgTextEncoderArray` `postgresql/oid/array.ts:20-40`                                      |
| `PG::TextDecoder::Array`, `#decode`                                                          | `postgresql/oid/array.rb:20,26,37`          | C `ext/pg_text_decoder.c:1005`, `pg_coder.c:477`              | `PgTextDecoderArray` `oid/array.ts:42-60`                                                 |
| `PG::Coder#initialize`, `#name`, `#oid`                                                      | `postgresql_adapter.rb:1149,1155`           | Ruby `lib/pg/coder.rb:17`; C `pg_coder.c:591,570`             | absent                                                                                    |
| `PG::TextEncoder::Integer`, `::Boolean`                                                      | `postgresql_adapter.rb:1087-1089`           | C `pg_text_encoder.c:817,815`                                 | absent                                                                                    |
| `PG::TextDecoder::Integer`, `::Float`, `::Numeric`, `::Boolean`, `::Bytea`, `::Timestamp`    | `postgresql_adapter.rb:1117-1126,1145`      | C `pg_text_decoder.c:992,994,183,990,998,1002`                | type parsers in `postgresql-adapter.ts:570-622` and `postgresql/temporal-type-parsers.ts` |
| `PG::TextDecoder::TimestampUtc`, `TimestampWithoutTimeZone`, `TimestampWithTimeZone`, `Date` | `postgresql_adapter.rb:1096-1097,1125-1128` | Ruby `lib/pg/text_decoder/timestamp.rb:7,27,28`, `date.rb:11` | same                                                                                      |
| `PG::SimpleDecoder`                                                                          | `postgresql_adapter.rb:1158`                | C `pg_coder.c:600`                                            | `MoneyDecoder` has no superclass                                                          |
| `PG::TypeMapByClass#[]=`                                                                     | `postgresql_adapter.rb:1086-1089`           | C `ext/pg_type_map_by_class.c:264,266`                        | absent                                                                                    |
| `PG::TypeMapByOid#add_coder`                                                                 | `postgresql_adapter.rb:1100,1139-1146`      | C `ext/pg_type_map_by_oid.c:378,380`                          | `Map<number, fn>`                                                                         |

The decoder rows overlap the claimed RFC 0180 story
`pg-and-mysql-wire-casts-register-where-rails-configures-the-driver`. This RFC's type-map story
depends on it and takes whatever it leaves.

#### Constants and errors

| gem member                                                                                     | Rails call site                                                          | gem definition                                                   | trails today                                                                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `PG::PQTRANS_IDLE`, `_INTRANS`, `_INERROR`                                                     | `postgresql/database_statements.rb:124`, `postgresql_adapter.rb:375,850` | C `ext/pg.c:422,426,428`                                         | local consts `postgresql-adapter.ts:144-147`, `postgresql/database-statements.ts:253-255`                           |
| `PG::CONNECTION_OK`                                                                            | `postgresql_adapter.rb:313`                                              | C `pg.c:367`                                                     | local const `postgresql-adapter.ts:149`                                                                             |
| `PG::PG_DIAG_SQLSTATE`, `_SOURCE_FUNCTION`, `PG::Result::PG_DIAG_MESSAGE_PRIMARY`, `_SEVERITY` | `postgresql_adapter.rb:804,902-903,967-969`                              | C `pg.c:550,608,555,531`; mixed into `Result` `pg_result.c:1702` | absent                                                                                                              |
| `PG::Error`, `#result`, `#connection`                                                          | `postgresql_adapter.rb:59,315,355,804,902`, `database_statements.rb:132` | C `ext/pg_errors.c:78,84-85`; Ruby `lib/pg/exceptions.rb:9-10`   | absent; node-pg errors are bare `Error` or `DatabaseError`. **Blocked: `pg-translate-exception-respond-to-result`** |
| `PG::ConnectionBad`                                                                            | `postgresql_adapter.rb:808,947`                                          | C `pg_errors.c:89`                                               | absent; message matching                                                                                            |
| `PG::FeatureNotSupported`                                                                      | `postgresql/database_statements.rb:142`                                  | C `ext/errorcodes.def:49-50` (SQLSTATE `0A000`)                  | `error.code === "0A000"`                                                                                            |

#### Blocked stories this surface concerns

| blocked story                                                                     | method                                                        | what the wrapper changes                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pg-translate-exception-respond-to-result` (0178)                                 | `PG::Error#result`, `Result#error_field`, `PG::ConnectionBad` | the wrapper raises the gem's classes carrying a `PG::Result`; unblocks                                                                                                                                                                                                                                                                             |
| `pg-translate-no-connection-raises-not-established` (0123)                        | the `PG::ConnectionBad` a query raises, and its message       | Rails tells a libpq failure from a pg-internal one by whether the message ends in a newline (`postgresql_adapter.rb:808-818`); node-pg gives one message for both. The wrapper owns the socket events, so it can raise the two messages libpq does. Retested by `pg-connection-status-reports-connection-bad-after-termination`, not assumed fixed |
| `pg-quote-string-escapes-without-with-raw-connection` (0123)                      | `Connection#escape`                                           | not unblocked: the blocker is the adapter's async `with_raw_connection` under a sync `quote`, not the gem method. See open question 2                                                                                                                                                                                                              |
| `pg-max-identifier-length-sync-async-split`, `pg-lookup-cast-type-*` (0180, 0123) | none                                                          | not gem surface (`query_value` under a sync caller); untouched                                                                                                                                                                                                                                                                                     |

### Package shape

`packages/pg/`, `@blazetrails/pg`, files mirroring the gem as `packages/msgpack/src/` mirrors
`lib/msgpack/`. A class the gem defines in both `ext/*.c` and `lib/pg/*.rb` is one TS file.

| gem                                                                          | `packages/pg/src/`                                                                        |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `lib/pg.rb`, `ext/pg.c`                                                      | `pg.ts` (`PG.connect`, `PG::Constants`), `namespaces.ts`, `index.ts`                      |
| `lib/pg/connection.rb`, `ext/pg_connection.c`                                | `connection.ts`                                                                           |
| `lib/pg/result.rb`, `ext/pg_result.c`                                        | `result.ts`                                                                               |
| `lib/pg/exceptions.rb`, `ext/pg_errors.c`, `ext/errorcodes.def`              | `exceptions.ts`                                                                           |
| `lib/pg/coder.rb`, `ext/pg_coder.c`                                          | `coder.ts`                                                                                |
| `ext/pg_text_encoder.c`, `ext/pg_text_decoder.c`, `lib/pg/text_decoder/*.rb` | `text-encoder.ts`, `text-decoder.ts`, `text-decoder/date.ts`, `text-decoder/timestamp.ts` |
| `ext/pg_type_map_by_oid.c`, `ext/pg_type_map_by_class.c`                     | `type-map-by-oid.ts`, `type-map-by-class.ts`                                              |

- **npm peer.** `pg` is a `peerDependencies` entry of `@blazetrails/pg` with
  `peerDependenciesMeta.pg.optional: true`, the shape activerecord's own `package.json` already has
  for it. `@blazetrails/pg` in turn becomes an optional peer of activerecord, as
  `@blazetrails/msgpack` is, and activerecord's direct `pg` peer is removed in the last migration
  step.
- **Dependencies.** `@blazetrails/ruby-compat` and nothing else from the workspace. The package is a
  leaf; it must not import activerecord or activesupport.
- **Exports.** `"."` only. The engine boundary below is not a subpath until a second engine exists.
- **How the adapter gets a connection.** `PostgreSQLAdapter.new_client` is
  `PG.connect(**conn_params)` with Rails' `rescue ::PG::Error` (`postgresql_adapter.rb:57-72`), and
  `@raw_connection` is a `PG::Connection`. The `Object.assign` in `pgConnection()` and the four
  assignments in `_attachReadyForQueryListener` are deleted, not moved.
- **Async from the first PR.** A method that performs I/O in libpq returns a promise: `PG.connect`,
  `exec` / `async_exec` / `query`, `exec_params`, `prepare`, `exec_prepared`, `get_last_result`,
  `cancel`, `block`, `reset`, `close`, `set_client_encoding`. A method that reads connection-local
  state or computes is synchronous, as it is in libpq: `transaction_status`, `status`, `finished?`,
  `server_version`, `socket_io`, the escapers, `quote_ident`, the type-map accessors, and all of
  `PG::Result` and the coders. This is the split the adapter already has
  (`live.transactionStatus() !== PQTRANS_IDLE` is sync at `postgresql-adapter.ts:689`).
- **No behaviour beyond the gem's.** The `OID_BYTEA` passthrough in `pg-connection.ts:16-28` and the
  `PREPARED` WeakMap (`:30`) are node-pg quirks and stay inside the package as private state. Statement
  caching, type-map construction, exception translation and the cancel-on-rollback decision are
  Rails' and stay in the adapter.
- **A second client.** `PG::Connection` holds a private engine object behind an internal interface
  with one implementation, node-pg. That boundary is not public and not a seat: the package always
  wraps a real client, and `PG.connect` with `pg` uninstalled is `LoadError`, the
  `gem "pg"; require "pg"` arm. A second engine is not planned here (§ Non-goals).

### Registration cost

From what trails#8591 (`packages/msgpack`) touched, plus the registrations that PR missed and its follow-ups added:

1. `pnpm-workspace.yaml` (if not globbed), root `tsconfig.json` references, `packages/pg/package.json`,
   `packages/pg/tsconfig.json`, `packages/pg/README.md`, `pnpm-lock.yaml`.
2. `vitest.config.ts` `resolve.alias`; the website vitest alias is a prefix match, so check
   `@blazetrails/pg` does not swallow or get swallowed.
3. `vendor/sources.ts` (source `pg`, `https://github.com/ged/ruby-pg.git`, ref `v1.5.9`, `libPath:
"lib/pg"`, `libEntryFile: "lib/pg.rb"`, `testPath: "spec/pg"`), `vendor/sources.lock.json`, and the hard-coded lists in `vendor/sources.test.ts`
   (`apiComparePackages`, `testPathsManifest`, `libEntryFilesManifest`).
4. `scripts/api-compare/config.ts` `PACKAGES`; `ENROLLED_PACKAGES` in
   `scripts/api-compare/lint-ruby-compat-calls.ts`; `scripts/parity/conventions.ts` package lists
   (`:495-530`); `arm-throw-mark.ts`; `param-name-mark.ts`.
5. `scripts/test-compare/`: `compare.ts`, `extract-ts-tests.ts`, `generate-stubs.ts`, a hand-added
   row in `assertion-mismatch-mark.json` (never reseed), and any RSpec matcher the gem's specs use
   that is not in `assertion-kinds.ts`.
6. `.github/workflows/ci.yml`: the package-family regex, the lane's `pnpm vitest run` step, the
   coverage package list; and `scripts/ci-suite-coverage.test.ts`'s fixture literals, which
   `.replace()` the lane line verbatim.
7. Because activerecord will import it by package name: `packages/activerecord/package.json`
   peers, `packages/activerecord/dx-tests/tsconfig.json` and `virtualized-dx-tests/tsconfig.json`
   `paths`, and the FileStore lock-worker resolve hook.
8. `packages/activesupport/src/support/rails-private-methods.generated.ts` regenerates.

The package's specs need a PostgreSQL server, so its CI lane is the PG lane, not Leaf Tests.

### Migration: which step removes which receipt

§ Rollout is the full ordered list of stories. This section covers only the steps that
remove a `@noRailsEquivalent` receipt or delete an ad hoc carrier, because that is the migration
proper. The order between them is the `deps` graph, not this list.

| story                                                   | removes                                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pg-package-and-vendor-source`                          | the two local constant blocks (`postgresql-adapter.ts:144-150`, `postgresql/database-statements.ts:253-255`); no receipts |
| `pg-result-moves-to-the-package`                        | 12 receipts; `pg-result.ts`                                                                                               |
| `pg-array-coders-move-to-the-package`                   | 6 receipts in `oid/array.ts`                                                                                              |
| `pg-connection-exec-surface-moves-to-the-package`       | four of `pgConnection()`'s six entries; `new pg.Client` in `newClient`                                                    |
| `pg-connection-status-cancel-block-move-to-the-package` | `_attachReadyForQueryListener`, `_cancel`, `_blockUntilCommandSettles`, `socketIo`                                        |
| `pg-connection-escaping-moves-to-the-package`           | the last 2 receipts; `pg-connection.ts`                                                                                   |

The other nine stories in § Rollout remove no receipt. They are convergence of bodies that are
open-coded without a receipt (5: errors, the termination retest, session setters, type maps,
decoders), the adapter's remaining node-pg types (2), spec enrollment, and the 0180 close-out.

**No receipt is retagged.** The 20 receipts keep naming the two RFC 0180 stories until the move
story that owns each one deletes it. `pg-retire-the-0180-pg-gem-stories` runs after the three
receipt-removing stories above that touch them and only closes stories nothing cites any more, so
`stale-refs` never sees a closed id.

**The two RFC 0180 stories**, proposed and not run:

- `pg-gem-result-and-array-coders-score-against-the-pg-gem`: its criteria are the result and
  array-coder stories here. While those are open it must not be claimed separately. At activation
  the owner either `tasks block`s it with the reason "superseded by `<n>-pg-gem-port`, closes with
  `pg-retire-the-0180-pg-gem-stories`", or leaves it and accepts the race.
- `pg-gem-connection-surface-scores-against-the-pg-gem`: its criteria are the three connection
  move stories here. If it is unclaimed at activation, same treatment. If work on it has landed or
  is in review at activation, that work is kept: the three connection stories are re-read against
  it and reduced to moving what it built into `packages/pg`, by markdown PR, before any is
  claimed. Its live state is in this RFC's PR description, not here, because it will have changed
  by merge. See open question 1.

## Non-goals

- **The sqlite3 gem.** Its wrapper is a separate RFC (RFC 0187, `sqlite3-gem-port`). § Scoring
  measures sqlite3 only as evidence of what the extractor does with C today.
- **Scoring the C-defined surface.** No extractor arm that reads `rb_define_method` tables, and no
  per-export citation lint. § Scoring records what that leaves unmeasured.
- **PGlite, or any second engine.** `@electric-sql/pglite` is not a dependency of anything in this
  RFC. The engine boundary in § Package shape is all that is kept for it; an in-browser PostgreSQL
  is its own RFC when the website needs one.
- **The gem.** No `PG::Tuple`, `PG::BasicTypeRegistry`, `BasicTypeMapFor*`, binary coders, COPY,
  large objects, pipeline mode, or any `Connection` method outside the table.
- **actioncable's subscription adapter.** `action_cable/subscription_adapter/postgresql.rb:21-106`
  calls `exec`, `escape_identifier`, `escape_string` and `wait_for_notify`. actioncable has its own
  RFC (0177); it adds those four when it needs them.
- **mysql2.** Out of scope. A `packages/mysql2` can take the same optional-peer shape.
- **Trilogy**, and **`ActiveRecord::Promise`**: CLAUDE.md has a section on each.
- **Making `quote` or `to_sql` async.** Ratified in CLAUDE.md § "`Relation` is evaluated by an async
  query".
- **Porting the C.** node-pg is the engine.

## Alternatives considered

- **A C-extension arm in the Ruby extractor.** Reads each gem's `rb_define_*` calls and scores
  name, arity and owner class for C-defined methods. About 600 LOC of `scripts/` plus a per-gem
  macro table, for a scoring gain and no change in adapter behaviour. Rejected by the owner: the
  adapter suite already passes, and the package is wanted for its shape, not for a number.
- **Score by citation, the ruby-compat model.** A resolved `vendor/pg/<version>/<file>:<line>`
  citation and a `@noRailsEquivalent PERMANENT` receipt per export. Rejected: it keeps a receipt
  on every member for ever and checks only that the cited line exists.
- **Vendor the gem and score in place, no package.** The first 0180 story allowed this and
  trails#8687 did it for `PG::Connection`. It leaves a nested parity package inside activerecord,
  the `PACKAGE_SRC_SUBDIR` shape RFC 0184 records as being undone; this RFC moves it out.
- **Call node-pg directly and baseline the difference.** Every adapter line that names a gem method
  becomes a call-gate row.

## Rollout

**RFC 0187 (`sqlite3-gem-port`) planned to consume this RFC's extractor arm.** That story is
closed here, and RFC 0187 took the same decision: its `sqlite3-enroll-the-c-extension-surface` is
closed too, and no edge runs between the two RFCs.

This is the authoritative order. Within a phase, stories with no `deps` edge between them can run
in parallel; across phases the `deps` graph is what binds, and a phase number is not a dependency.

1. Package: `pg-package-and-vendor-source` (includes the PG CI lane).
2. Result and coders, each needing only the package: `pg-result-moves-to-the-package`,
   `pg-array-coders-move-to-the-package`; then
   `pg-type-maps-and-text-encoders-move-to-the-package` (needs both, and the claimed RFC 0180
   wire-casts story), then `pg-text-decoders-move-to-the-package`. This phase does not depend on
   phase 3 and can run beside it.
3. Connection: `pg-connection-exec-surface-moves-to-the-package` (needs the result story), then in
   parallel `pg-connection-status-cancel-block-move-to-the-package`,
   `pg-connection-escaping-moves-to-the-package` (gated on open question 2),
   `pg-errors-carry-result-and-connection`; then
   `pg-connection-session-setters-move-to-the-package` (needs errors) and
   `pg-connection-status-reports-connection-bad-after-termination` (needs status and errors).
4. Close-out: `pg-adapter-constructor-takes-a-pg-connection`, then
   `pg-activerecord-loads-the-package-as-an-optional-peer`;
   `pg-gem-specs-enroll-in-parity-test` (gated on open question 6);
   `pg-retire-the-0180-pg-gem-stories` (after the result, array-coder and escaping stories).

Three stories rehomed here from other RFCs are not in this order and bind only through their own
`deps`: `pg-array-coders-port-the-gem-parser-flags-and-elements-type`,
`pg-result-type-map-defaults-to-strings-for-oids-with-no-coder` and
`pg-unescape-bytea-matches-pqunescapebytea-on-malformed-input`.

## Verification

- `grep -rn "noRailsEquivalent" packages/activerecord/src/connection-adapters/postgresql/pg-*.ts packages/activerecord/src/connection-adapters/postgresql/oid/array.ts`
  returns nothing (20 today), and both `pg-*.ts` files are gone.
- `pnpm parity:api` prints a `pg` row sourced from `packages/pg` whose denominator is the
  Ruby-defined methods of the surface tables and whose missing count is 0. `PACKAGE_SRC_SUBDIR` has
  no `pg` entry.
- `grep -rn "from \"pg\"" packages/activerecord/src --include=*.ts` returns only test files.
- `pg-translate-exception-respond-to-result` is unblocked and done.

## Open questions

1. **The RFC 0180 connection story.** `pg-gem-connection-surface-scores-against-the-pg-gem` covers
   the same ground as three stories here and was being worked when this RFC was drafted (state in
   the PR description). Let it land in activerecord and have this RFC move the result into the
   package, or stop it and do the work once, in the package? Whichever is answered, § Migration
   already says what happens to the three stories.
2. **`escape_bytea` and `escape` through `valid_raw_connection`.** Rails is
   `valid_raw_connection.escape_bytea(value)` (`quoting.rb:71`) and
   `with_raw_connection { |c| c.escape(s) }` (`quoting.rb:129`). In trails `validRawConnection()` is
   async and both are reached from the synchronous `quote` → `to_sql` chain CLAUDE.md ratifies. The
   gem also defines both as singleton methods (`pg_connection.c:4484,4486`), which need no
   connection. May the adapter call the singleton form (`PG::Connection.escape_bytea(value)`) with
   a `@missingRailsCall valid_raw_connection` receipt, or is this a new ratified section, or should
   it stay blocked beside `pg-quote-string-escapes-without-with-raw-connection`?
3. **Citation fallback.** Resolved 2026-10-08: neither the extractor arm nor the citation model.
   The C surface is unscored (§ Scoring).
4. **PGlite.** Resolved 2026-10-08: out of this RFC. The private engine boundary stays; the story
   is closed (§ Non-goals).
5. **`conndefaults_hash`.** libpq answers it from the installed client library. node-pg has no
   equivalent, so the wrapper would hold libpq 17's option list as a literal. Acceptable, or keep
   the adapter's allowlist with a receipt?
6. **Spec port.** The gem's specs are RSpec against a live server. Port the examples for the
   wrapped methods only (recommended, about 500 LOC), or skip `parity:test` for this package as `date`
   skips `parity:api`?

## Changelog

- 2026-10-08: initial draft
- 2026-10-08: numbered 0186; RFC 0187's dependency on the extractor story is wired, and the prose that asked for it is replaced
- 2026-10-08: review round 1 (tasks#260): method count corrected to 39 C of 48 and defined; constants stated as 8 + 2; § Rollout made the authoritative order and § Migration reduced to receipt removal; receipts are no longer retagged; live status of the 0180 story moved to the PR description; sqlite3, msgpack and date added to Non-goals; the blocked termination story re-attributed from `status` to the raised error after re-reading `postgresql_adapter.rb:804-818`
- 2026-10-08: § Rollout states the cross-RFC edge to wire at numbering time (from tasks#261's review)
- 2026-10-08: self-review round 1: located the two unverified call sites; verified `server_version` against node-pg 8.19's source; split the type-map story in two (every story now at or under 600 est-loc); sections regrouped under `## Design` to match the template
- 2026-10-08: owner decision: the package stays, the C extractor arm and PGlite go. § Scoring now takes the msgpack shape (Ruby `def`s scored, C surface unscored and ungated); stories `c-ext-method-table-extractor-arm`, `ruby-extractor-reads-c-defined-gem-methods`, `pg-enroll-the-c-extension-surface` and `pg-pglite-engine` closed; open questions 3 and 4 resolved; § Motivation notes what trails#8687 already landed
- 2026-10-08: owner decision: the score's denominator is the methods activerecord calls; uncalled gem files and methods are unported-files rows and scoped skips
