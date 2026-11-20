---
rfc: "0000-mysql2-gem-port"
title: "mysql2: lift the nested mysql2 gem port out of activerecord into @blazetrails/mysql2"
status: draft
created: 2026-11-20
updated: 2026-11-20
owner: "@deanmarano"
packages:
  - mysql2
  - activerecord
  - "scripts"
clusters:
  - package
  - client
  - adapter-glue
  - scoring
related-rfcs:
  - "0186-pg-gem-port"
  - "0187-sqlite3-gem-port"
  - "0191-rails-8-0-5-1-upgrade-workflow"
  - "0100-package-size-and-publish-shape"
  - "0156-parity-beyond-name-presence"
  - "0234-no-void-promises"
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — mysql2 gem wrapper

## Summary

Rails' MySQL adapter is written against the `mysql2` gem
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:3-4`),
resolved to 0.5.6 by `vendor/rails/v8.0.2/Gemfile.lock:380`. trails already vendors the gem
(`vendor/sources.ts:423-440`, `vendor/mysql2/0.5.6`), mirrors it from
`packages/activerecord/package.json` (`mirrors[0]`), and scores it in `parity:api` as a package nested
inside activerecord at `packages/activerecord/lib/mysql2/` (`scripts/api-compare/config.ts:47,118`).
This RFC lifts that port into its own workspace package, `@blazetrails/mysql2`, wrapping the npm
`mysql2` client as an optional peer, exactly as RFC 0186 (`pg-gem-port`) wraps node-pg in
`packages/pg`. It is the third of the three adapter-gem lifts and is packaging prep for RFC 0100
(`package-size-and-publish-shape`): after it, `@blazetrails/activerecord` no longer carries any
driver client's gem surface in its own tree.

Both sibling RFCs leave mysql2 out explicitly (RFC 0186 § Non-goals, "mysql2. Out of scope. A
`packages/mysql2` can take the same optional-peer shape."; RFC 0187 § Non-goals, "mysql2, Trilogy,
`ActiveRecord::Promise`"). This RFC is that `packages/mysql2`.

## Motivation

Measured on `origin/main` at `5c15a68516`, after `pnpm build`.

### What is nested today

| file                                         | lines | what it is                                                                                                                       |
| -------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| `packages/activerecord/lib/mysql2/client.ts` | 690   | `Mysql2::Client` as free functions plus a decorator that grafts the gem's names onto a `mysql2/promise` `Connection` at run time |
| `.../lib/mysql2/error.ts`                    | 110   | `lib/mysql2/error.rb`, faithful, plus an invented `instanceof` hook                                                              |
| `.../lib/mysql2/result.ts`                   | 26    | `Mysql2::Result`: `fields`, `size`, `toA`, `free`                                                                                |
| `.../lib/mysql2/statement.ts`                | 34    | `Mysql2::Statement`: `execute`, `_execute`, `affectedRows`, `close`                                                              |

`pnpm parity:api --package mysql2` today:

```text
mysql2  —  12/33 methods (36.4%)  |  files: 4/7  |  inheritance: 3/4 (75%)  |  arity: 7/7 (100%)
client.rb     4 / 12  (8 missing, 2 of them declaration-only)
em.rb         0 / 6
error.rb      7 / 7
field.rb      0 / 5
mysql2.rb     0 / 1
result.rb     0 / 1   (server_flags)
statement.rb  1 / 1
```

`em.rb` (EventMachine), `field.rb` (`Mysql2::Field` Struct) and `mysql2.rb`'s
`Util.key_hash_as_symbols` are not called by activerecord; as in RFC 0186 § Scoring they become
`UNPORTED_FILES` / `SCOPED_SKIP_GROUPS` rows with "not called by activerecord", so the denominator is
what activerecord calls.

### `client.ts` is three things

Reading it line by line, `client.ts` mixes the gem's Ruby half, the gem's C half (as an engine over
`mysql2/promise`), and activerecord glue:

1. **Gem, Ruby-defined (`lib/mysql2/client.rb`), scored.** `defaultQueryOptions` (`client.ts:206`,
   `client.rb:5`), `initialize` (`:552`, `client.rb:21`), `parseFlagsArray` (`:649`, `client.rb:111`),
   `parseConnectAttrs` (`:663`, `client.rb:139`), `query` (`:227`, `client.rb:149`), `localOffset`
   (`:678`, `client.rb:171`). The `attr_reader :query_options, :read_timeout` (`client.rb:3`) has only
   the `Mysql2Client` interface (`:84-96`), which is the 2 declaration-only rows.
2. **Gem, C-defined (`ext/mysql2/client.c:1561-1605`, `result.c:1230-1235`, `statement.c:626-632`),
   unscored.** `connect` (`:517`, `rb_define_private_method(..."connect"...)`, `client.c:1604`),
   `_query` (`:463`, `client.c:1605`), `prepare` (`:235`), `setServerOption` (`:181`),
   `abandonResultsBang`, `warningCount`, `automaticClose`, the cast table (`cast`, `:251-389`, the port
   of `result.c`'s `rb_mysql_result_fetch_row`) and `storeResult` / `options` / `driverError`
   (`:62-140`, the engine boundary that `rb_mysql_query` / `rb_raise_mysql2_error` are in C).
3. **activerecord glue that belongs in the adapter.** `bind` (`:404-414`) type-casts binds with
   activerecord's `quotedDate` and `defaultTimezone()` (`client.ts:14-15`) and activesupport's
   `TimeWithZone` (`:13`). That is Rails' `type_casted_binds`
   (`mysql2/database_statements.rb:64-66`) territory, not the gem's: the gem binds a Ruby `Time`
   natively in C (`statement.c`). It is also the import that stops the code moving: a package that
   imports `../connection-adapters/abstract/quoting.js` cannot leave activerecord.

The adapter side also reaches past the gem into `mysql2/promise` internals where Rails calls a gem
method:

| trails (`packages/activerecord/lib/connection-adapters/mysql2-adapter.ts`)                                                       | Rails (`mysql2_adapter.rb`)                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `isConnected` reads `conn.connection._closing` / `stream.destroyed` (`:146-157`)                                                 | `!(@raw_connection.nil? \|\| @raw_connection.closed?)` (`:104-106`)                                                                 |
| `disconnectBang` / `reconnect` call `end()` (`:181`, `:215`)                                                                     | `@raw_connection&.close` (`:126`, `:152`)                                                                                           |
| `getFullVersion` reads `_handshakePacket.serverVersion` (`:247-251`); `client.ts:49-59` re-derives it for `Error#server_version` | `any_raw_connection.server_info[:version]` (`:168-170`)                                                                             |
| `translateException` classifies npm error `code`s in `isMysql2DriverTimeout` / `isMysql2ConnectionError` (`:337-367`)            | `exception.is_a?(::Mysql2::Error::TimeoutError) && !exception.error_number`, `is_a?(::Mysql2::Error::ConnectionError)` (`:172-182`) |

### Receipts and run-time-assigned surface

Eight `@noRailsEquivalent PERMANENT` receipts sit in the nested port:

| receipt                     | site               | fate                                                                                                             |
| --------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `DRIVER_ERRORS`             | `error.ts:3`       | deleted: the engine raises `Mysql2::Error` subclasses, so no npm error needs to answer `instanceof Mysql2.Error` |
| `Error[Symbol.hasInstance]` | `error.ts:55`      | deleted, same reason                                                                                             |
| `driverError`               | `client.ts:61`     | story 4: becomes the engine's `rb_raise_mysql2_error` analogue, unscored C-half, no receipt                      |
| `options`, `storeResult`    | `client.ts:99,113` | private engine members of `Client`, unscored C-half, no receipt                                                  |
| `INVALID_DATE`              | `client.ts:393`    | an instance field of `Client` (the C wrapper's state), no receipt                                                |
| `connect`                   | `client.ts:516`    | wrong receipt: `connect` is the gem's C private method; kept at that name, receipt deleted                       |
| `initialize`                | `client.ts:551`    | wrong receipt: `Client#initialize` is a Ruby `def`; it becomes the constructor and `static async new`            |

Run-time-assigned surface: `mysql2Client()` (`client.ts:449-499`) `Object.defineProperty`s
`queryOptions`, `affectedRows`, `_query`, `query`, `prepare`, `abandonResultsBang`,
`setServerOption`, `warningCount` and `automaticClose` onto the npm `Connection`, wraps its `execute`
(`:452-457`), monkeypatches `connection.handlePacket` (`:478-487`) and replaces `config.typeCast`
(`:489-497`), and keeps per-connection state in five module `WeakMap`/`WeakSet`s (`TYPE_CAST`,
`INVALID_DATE`, `QUERY_OPTIONS`, `WARNING_COUNT`, `AUTOMATIC_CLOSE`). `Mysql2.Client` itself is an
object literal with a `new` arrow (`:675-690`), not a class: there is no `Mysql2::Client` for
`attr_reader`, `instanceof` or `parity:api` inheritance to find. Six test files call `mysql2Client()`
directly on a hand-built connection (`grep -rn mysql2Client packages/activerecord/test`).

### The measured split

Of the gem methods activerecord calls (`mysql2_adapter.rb`, `mysql2/database_statements.rb`,
`abstract_mysql_adapter.rb:697,773-778`):

| class               | defined in C                                                                                                                                                                 | defined in Ruby                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mysql2::Client`    | 12: `close`, `closed?`, `ping`, `server_info`, `escape`, `last_id`, `affected_rows`, `prepare`, `set_server_option`, `abandon_results!`, `automatic_close=`, `warning_count` | 8: `default_query_options`, `initialize`, `parse_flags_array`, `parse_connect_attrs`, `query`, `local_offset`, `query_options`, `read_timeout` |
| `Mysql2::Result`    | 4: `each`, `fields`, `free`, `size` (alias of `count`)                                                                                                                       | 0 (`to_a` is `Enumerable`)                                                                                                                     |
| `Mysql2::Statement` | 2: `affected_rows`, `close`                                                                                                                                                  | 1: `execute`                                                                                                                                   |
| `Mysql2::Error`     | 0                                                                                                                                                                            | 7, all of `error.rb` (scored 7/7 today): `initialize`, `new_with_args`, `clean_message`, `error_number`, `sql_state`, `errno`, `error`         |
| **total**           | **18**                                                                                                                                                                       | **16**                                                                                                                                         |

How the 16 maps onto today's rows: `client.rb` has 12 Ruby rows; the 8 in the Client cell above are
scored (4 match today: `default_query_options`, `parse_flags_array`, `parse_connect_attrs`, `query`;
4 are missing: `initialize`, `local_offset`, and the declaration-only `query_options` /
`read_timeout`), and the other 4 (`parse_ssl_mode`, `find_default_ca_path`, `query_info`, `info`) are
`SCOPED_SKIP_GROUPS` rows. `result.rb`'s one row is `attr_reader :server_flags` (`result.rb:3`),
which activerecord does not read, so it is a `SCOPED_SKIP_GROUPS` row too. `error.rb` is 7/7 and
`statement.rb` 1/1 (`execute`) today. 8 + 7 + 1 = 16.

As with pg, the 18 C-defined methods keep their gem names, are reported as extra surface by
`pnpm parity:api:extra --package mysql2`, carry no receipt, and gate nothing. `escape` is listed
because Rails calls it (`abstract_mysql_adapter.rb:697`); trails' `quoteString` deliberately does
not (`abstract-mysql-adapter.ts:936-946`, `@missingRailsCall with_raw_connection — PERMANENT`), so
the package does not need to ship it.

## Design

### Package shape

`packages/mysql2`, `@blazetrails/mysql2`, shaped like `packages/pg`: `type: module`, one `"."`
export, `files: [dist]`, `build: tsc`, the npm `mysql2` under `peerDependencies` with
`peerDependenciesMeta.mysql2.optional: true`, and only `@blazetrails/ruby-compat` and
`@blazetrails/date` as workspace dependencies (`BigDecimal` is ruby-compat's, `lib/index.ts:211`).
**No import of activerecord or activesupport**: that is what makes it a package. Layout follows the
gem: `lib/mysql2.ts`, `lib/client.ts`, `lib/error.ts`, `lib/result.ts`, `lib/statement.ts`, tests in
`test/` as `spec/mysql2/` lays them out.

The engine boundary is `mysql2/promise`: the C half is written in the class bodies over it, as
`packages/pg` writes `PG::Connection` over node-pg. No second engine is planned.

### `Mysql2::Client` is a class

`Client#initialize` ends in `connect(...)` (`client.rb:95`), which is network I/O, so by CLAUDE.md
§ "Every promise has an owner" (RFC 0234) it is a `protected constructor` holding the synchronous
part of `initialize` (option parsing, flag arithmetic, the deprecation warnings) and a
`static async new` that awaits `connect`. Every caller writes `await Mysql2.Client.new(config)`,
which is already the call `mysql2-adapter.ts:52` makes. The wrapped `mysql2/promise` `Connection`
is a private field; `query_options` and `read_timeout` are real readers; the five `WeakMap`s become
instance fields; `handlePacket` / `typeCast` hooks are installed by `connect` on the connection the
client owns, not on a connection someone else built.

This converges the mysql2 bullet of RFC 0156's
`declaration-only-mysql2-client-readers-and-struct-attributes-writer`, which names exactly this shape
("porting `Mysql2::Client` as a class whose `initialize` sets `@query_options` / `@read_timeout`").
That story stays where it is and keeps its solid-queue row; this RFC does not file a second story for
the two readers.

### Registration cost

As RFC 0186 § "Registration cost", items 1 to 8, with `mysql2` substituted, plus: remove `mysql2`
from `PACKAGE_DIR_OVERRIDES` and `PACKAGE_SRC_SUBDIR` (`scripts/api-compare/config.ts:47,118`); move
the `mysql2` entry of `mirrors` from `packages/activerecord/package.json` to the new package; give
the `vendor/sources.ts` entry `testPath: "spec/mysql2"`. The package's tests need a server, so they
run on the MariaDB lane, not Leaf Tests; whether as their own step is open question 1.

### Scoring

As RFC 0186 § "Scoring": `parity:api` scores the Ruby `def`s under `lib/mysql2`; the C-defined
methods keep their gem names, carry no receipt and no citation, and `mysql2` is not added to
`GATED_PACKAGES`. The denominator is what activerecord calls.

## Rollout

1. `mysql2-package-and-vendor-source`: the package, `Mysql2::Error` moved in, registrations, the
   `UNPORTED_FILES` / `SCOPED_SKIP_GROUPS` rows. `error.ts` moves as-is, receipts and all.
2. `mysql2-client-result-statement-move-to-the-package`: `bind` goes to the adapter, the three files
   move, activerecord imports them by package name.
3. `mysql2-client-is-a-class-with-async-new`: the class, `static async new`, the end of
   `mysql2Client()` and of five receipts (`initialize`, `connect`, `options`, `storeResult`,
   `INVALID_DATE`).
4. `mysql2-adapter-calls-the-gem-not-the-npm-connection`: the four adapter rows above; the engine
   raises `TimeoutError` / `ConnectionError` and the last three receipts go (`driverError`,
   `DRIVER_ERRORS`, `Error[Symbol.hasInstance]`). 5 + 3 = the 8 in § "Receipts and
   run-time-assigned surface".
5. `mysql2-gem-specs-enroll-in-parity-test`: the gem's `spec/mysql2/*_spec.rb`, for the surface the
   package ships.

The order is the `deps` graph.

### Sequencing with other RFCs

This RFC is scheduled **after the Rails 8.0.5.2 upgrade (RFC 0191,
`rails-8-0-5-1-upgrade-workflow`)**, in the same wave as RFCs 0186 and 0187 (owner, 2026-11-20): the
bump re-reads the adapter files this RFC cites, and a lift landing mid-bump moves files the bump
ledger is pinned against. This is a scheduling decision, not a `deps-rfc` edge: RFC 0191 also scopes
8.1 and stays open well past the 8.0.5.2 bump, so an edge on it would block these stories indefinitely, and
neither sibling RFC carries one. Story 1 touches no adapter body and may run first. The output is
one more self-contained driver package for RFC 0100 (`package-size-and-publish-shape`) to publish.

### Open mysql2 stories this RFC touches but does not absorb

`mysql2-result-rows-are-typed-as-arrays-and-cache-rows-is-unread` (0189),
`mysql2-performquery-castresult-hashmode-collapses-duplicates`,
`converge-mysql2-statement-pool-field-name`, `mysql2-select-all-unprepared-statement-arm-has-no-test`,
`unify-execute-mutation-into-perform-query-mysql2` and
`mysql2-constructor-charset-collation-guard-rails-lacks` concern bodies that move or neighbour this
work. Each keeps its home; a story here that moves a file a ready story cites updates that story's
`file:line` prose in the same tasks PR.

## Non-goals

- **Trilogy.** Out of scope by CLAUDE.md § "Trilogy is out of scope".
- **Scoring the C half.** No extractor arm; RFC 0186 § "Alternatives considered" rejected it.
- **The gem beyond what activerecord calls.** No `Mysql2::EM`, `Field`, `async_result`,
  `more_results?` / `next_result` / `store_result`, `session_track`, `ssl_cipher`, `select_db`,
  `thread_id`, `query_info`, `find_default_ca_path`, `parse_ssl_mode`.
- **`escape` and `quoteString`.** trails' `quoteString` is synchronous and receipted `PERMANENT`;
  changing that is not packaging.
- **Changing the driver.** `mysql2/promise` in, `mysql2/promise` out.
- **Publishing.** RFC 0100 owns the release shape.

## Alternatives considered

- **Leave it nested.** Keeps a driver's run-time decorator inside activerecord's published tree and
  keeps `client.ts` importing activerecord, which RFCs 0186/0187 undo for pg and sqlite3.
- **Lift first, class later in a separate RFC.** Rejected: the move is cheap only once `bind` is
  out, and the class is the story that deletes most receipts; splitting it across RFCs leaves an
  orphaned half.
- **Keep `mysql2Client()` as a decorator in the package.** It would be the run-time grafting
  CLAUDE.md § "A Ruby module is a JS object or a JS class" rules out for a class Rails has.

## Verification

The RFC is done when all of these hold on `main`:

- `packages/activerecord/lib/mysql2/` does not exist, and `grep -rn "@blazetrails/active" packages/mysql2/lib` is empty.
- `pnpm parity:api --package mysql2` reads **16/16** methods (the Ruby-defined surface in § "The measured split") with every other `lib/mysql2/*.rb` method an `UNPORTED_FILES` or `SCOPED_SKIP_GROUPS` row, against 12/33 today; no `[declaration-only]` row.
- The 8 `@noRailsEquivalent` receipts in § "Receipts and run-time-assigned surface" are **0**, and `grep -rn "mysql2Client\|_handshakePacket\|_closing" packages/activerecord/lib` is empty.
- `pnpm parity:test` lists the four `spec/mysql2/*_spec.rb` files with a non-negative delta.

```bash
pnpm vitest run packages/mysql2 scripts/ vendor/
pnpm parity:api --package mysql2
pnpm parity:api:extra --package mysql2
```

## Open questions

1. **CI lane.** The MariaDB lane runs activerecord's MySQL suite. Does the package get its own step
   on that lane (as pg does on PostgreSQL), or ride activerecord's? Proposed: its own step.
2. **`automaticClose`'s stream teardown** (`client.ts:432-446`) is `discard!`'s fork-safety concern
   (`mysql2_adapter.rb:131-137`). Node has no `fork` (CLAUDE.md § "Runtime facts Node does not
   expose"); keep the arm as the nearest analogue, or make `automatic_close=` a plain setter?
   Proposed: keep it, it is the C body's `mysql_close` suppression translated.

## Changelog

- 2026-11-20: drafted.
- 2026-11-20: review: receipt split 5 + 3 with `driverError` in story 4; the 16 mapped onto today's rows (`server_flags` skipped); activerecord's dependency on the package registered in story 1.
- 2026-11-20: concrete Verification targets; § Scoring; sequencing stated as a scheduling decision, not a `deps-rfc` edge; cross-reference added to the RFC 0156 story.
