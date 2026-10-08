---
rfc: "0187-sqlite3-gem-port"
title: "sqlite3: lift the nested sqlite3 gem port out of activerecord into @blazetrails/sqlite3, and give the driver seam the gem's names"
status: postponed
created: 2026-10-08
updated: 2026-10-08
owner: "@deanmarano"
packages:
  - sqlite3
  - activerecord
  - website
  - "scripts"
clusters:
  - package
  - database-and-statement
  - drivers
  - migration
  - "findings"
related-rfcs:
  - "0180-activerecord-receipt-parity"
  - "0094-sqlite3-adapter-construction-fidelity"
  - "0184-msgpack-gem-port"
  - "0186-pg-gem-port"
---

# RFC 0187 — sqlite3 gem wrapper

## Summary

The premise that sqlite3 "has no wrapper package" is half true, and the half that is false changes
the plan. The gem is vendored (`vendor/sqlite3/v2.6.0`, the version
`vendor/rails/v8.0.2/Gemfile.lock:603` resolves) and **already enrolled in `parity:api` as a package
of its own, nested inside activerecord**: `scripts/api-compare/config.ts:46,110` maps `sqlite3` onto
`packages/activerecord/src/sqlite/` (4,386 lines, 229/303 methods, files 3/7). What it lacks is a
workspace package, the gem's two central classes, and any scoring of its C half.

So this RFC is a **lift and a rename**, not a port from nothing. It moves `src/sqlite/` to
`packages/sqlite3` (`@blazetrails/sqlite3`), replaces the trails-invented driver seam
(`SqliteDriver` / `SqliteConnection` / `SqliteStatement`, `packages/activerecord/src/sqlite-adapter.ts`)
with `SQLite3::Database` and `SQLite3::Statement` under the gem's method names. The gem's C half
stays unscored, as RFC 0186 (`pg-gem-port`) decided for pg: no extractor arm is built.

One constraint collides with the code as it stands and is put to the owner rather than resolved
here: see "Async" and open question 1.

## Motivation

`packages/activerecord/src/sqlite/` today:

| file                                                                 | lines | what it is                                                                                                                                                                                             |
| -------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pragmas.ts`                                                         | 690   | `SQLite3::Pragmas`, a faithful port of `lib/sqlite3/pragmas.rb`                                                                                                                                        |
| `errors.ts`                                                          | 252   | `lib/sqlite3/errors.rb` plus `ext/sqlite3/exception.c`'s `status2klass` / `rb_sqlite3_raise` / `rb_sqlite3_raise_with_sql` (3 receipts) and the invented `nativeStatus` / `sqlite3Errmsg` (2 receipts) |
| `database.ts`                                                        | 5     | `SQLite3::Database.quote` and nothing else                                                                                                                                                             |
| `better-sqlite3.ts`, `libsql.ts`, `node-sqlite.ts`, `expo-sqlite.ts` | 1,385 | one `SqliteDriver` per npm client, each under a **file-level** `@noRailsEquivalent CONVERGEABLE` cover                                                                                                 |
| `sqlite-uri.ts`                                                      | 43    | two helpers, 2 receipts onto another story                                                                                                                                                             |

and, outside it, `packages/website/src/lib/frontiers/sql-js-driver.ts`, a sixth driver over `sql.js`
for the in-browser sandbox.

The gem's `Database` and `Statement` classes exist in trails only as the `SqliteConnection` and
`SqliteStatement` interfaces. Those are half gem-shaped already (`bindParams`, `step`, `toA`,
`columns`, `changes`, `execute`, `getFirstValue`) and half better-sqlite3-shaped (`run`, `get`,
`all`, `iterate`, `reader`, `pragma`, `exec`, `isOpen`, `raw`). Being interfaces, they are excluded
from the extra-surface measure by kind ("64 novel `interface` declaration name(s) and member(s)",
`pnpm parity:api:extra --package sqlite3`), so the mismatch is unmeasured. That is the cost of the
current shape: the adapter's `perform_query` cannot read like Rails because the object it holds
does not have the gem's methods, and nothing reports it.

The three reasons for a package, tested:

1. **Adapter bodies read like Rails.** Holds, and is most of the value here.
   `sqlite3/database_statements.rb:80-109` is `execute_batch2`, `prepare`, `reset!`, `bind_params`,
   `column_count.zero?`, `step`, `columns`, `to_a`, `close`, `changes`; trails'
   `sqlite3/database-statements.ts:206-239` is `exec`, `prepare`, `bindParams`, `!stmt.reader`,
   `step`, `columns().map(c => c.name)`, `toA`, `close`, `changes`, `lastInsertRowId`.
2. **One home, receipts gone.** The home exists. The 9 receipts go because `packages/sqlite3` is
   ungated, as msgpack is: nothing there asks for one, so each is deleted by the story that
   reaches its member (§ Migration).
3. **A second client.** Already true and the strongest of the three: six clients implement the seam
   today. The package does not create that property; it gives the seam the gem's names and puts
   the clients behind them.

A well-argued "this should not be a package" was allowed for. The case against is that the lift
moves 4,386 lines to buy a directory change. It fails on RFC 0184's recorded decision that the
nested `PACKAGE_SRC_SUBDIR` shape is "not preferred and is being undone", and on the six drivers:
a browser bundle that wants `sql.js` should not resolve activerecord's `better-sqlite3` peer to get
the seam. **It should be a package.** What is not obviously right is the async constraint, below.

## Design

### Scoring

RFC 0186 (`pg-gem-port`) § "Scoring" has the measurements and the decision (owner, 2026-10-08):
no C extractor arm. `parity:api` scores `lib/sqlite3/*.rb`; a method the gem defines in C keeps its
gem name, is reported by `pnpm parity:api:extra --package sqlite3` as extra surface, and carries no
receipt. `sqlite3` is not added to `GATED_PACKAGES`. What checks the C half is the SQLite adapter
suite and the driver `*.trails.test.ts` suites.

**The denominator is what activerecord calls, and nothing else** (owner, 2026-10-08). Of the 74
methods missing today (229/303), one that activerecord does not call is not ported: its file is an
`UNPORTED_FILES` row or the method a `SCOPED_SKIP_GROUPS` entry, with the reason "not called by
activerecord". Story `sqlite3-score-only-what-activerecord-calls` does this. A method already
ported and matched stays scored; nothing is deleted to shrink the count.

The split for this gem, of the methods `sqlite3_adapter.rb` and `sqlite3/*.rb` call:

| class                 | defined in C (`ext/sqlite3/`)                            | defined in Ruby (`lib/sqlite3/`)                                                                                            |
| --------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `SQLite3::Database`   | 4 (`changes`, `close`, `closed?`, `busy_handler`)        | 7 (`new`, `quote`, `execute_batch2`, `prepare`, `encoding`, `rollback`, `busy_handler_timeout=`) plus the `Pragmas` setters |
| `SQLite3::Statement`  | 5 (`reset!`, `step`, `column_count`, `close`, `closed?`) | 3 (`bind_params`, `columns`, `each` for `to_a`)                                                                             |
| `SQLite3::ForkSafety` | 0                                                        | 1 (`suppress_warnings!`)                                                                                                    |
| **total**             | **9**                                                    | **11**, plus the pragma setters                                                                                             |

The Ruby half is thinner than the count suggests: every one of those Ruby methods bottoms out in a
private C method (`open_v2` `database.c:962`, `exec_batch` `:990`, `disable_quirk_mode` `:976`,
`Statement#prepare` `statement.c:701`, `bind_param` `:683`, `column_name` `:689`, `done?` `:687`),
and those are where an npm client differs. They are private to the engines and unscored.

`SQLite3::Constants::Open::SHAREDCACHE` is C (`ext/sqlite3/sqlite3.c:158`); the exception classes
are Ruby (`lib/sqlite3/errors.rb:4-87`) raised from C (`ext/sqlite3/exception.c:3-122`).

### The surface

Rails paths are under `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/`;
gem paths under `vendor/sqlite3/v2.6.0/`; trails paths under `packages/activerecord/src/`.

| gem member                               | Rails call site                                               | gem definition                                                                 | trails today                                                                                                            | npm clients                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Database.new(file, options)`            | `sqlite3_adapter.rb:35`                                       | Ruby `lib/sqlite3/database.rb:141`; C `open_v2` `ext/sqlite3/database.c:962`   | `SqliteDriver.open` / `openSync` (`sqlite-adapter.ts:156-164`), called `connection-adapters/sqlite3-adapter.ts:167-169` | each client's constructor. `strict:` → `disable_quirk_mode` (`database.c:976`): **Blocked: `better-sqlite3-driver-ignores-strict-false`** (better-sqlite3 builds with `SQLITE_DQS=0`). A remote libsql URL has no file: **Blocked: `libsql-remote-adapter-memory-placeholder-and-concurrency-override`** |
| `Database.quote`                         | `sqlite3/quoting.rb:67`                                       | Ruby `database.rb:112`                                                         | `sqlite/database.ts:2-4`                                                                                                | none needed                                                                                                                                                                                                                                                                                              |
| `#execute_batch2`                        | `sqlite3/database_statements.rb:80`                           | Ruby `database.rb:329`; C `exec_batch` `database.c:990`                        | `SqliteConnection.exec` (`sqlite-adapter.ts:35`), called `connection-adapters/sqlite3/database-statements.ts:206`       | `exec` (better-sqlite3, node:sqlite, sql.js), `execAsync` (expo)                                                                                                                                                                                                                                         |
| `#prepare`                               | `sqlite3/database_statements.rb:82,94`                        | Ruby `database.rb:215`; C `statement.c:701`                                    | `SqliteConnection.prepare` (`:34`)                                                                                      | `prepare` everywhere; async on expo and libsql remote                                                                                                                                                                                                                                                    |
| `#changes`                               | `sqlite3/database_statements.rb:109`                          | C `database.c:981`                                                             | `SqliteConnection.changes` (`:44`)                                                                                      | a property of the run result on every client; the wrapper remembers the last one                                                                                                                                                                                                                         |
| `#closed?`                               | `sqlite3_adapter.rb:207`                                      | C `database.c:967`                                                             | `isOpen()` (`:47`), inverted                                                                                            | `open` (better-sqlite3), tracked elsewhere                                                                                                                                                                                                                                                               |
| `#close`                                 | `sqlite3_adapter.rb:224`                                      | C `database.c:965`                                                             | `close` (`:46`)                                                                                                         | `close` / `closeAsync`                                                                                                                                                                                                                                                                                   |
| `#encoding`                              | `sqlite3_adapter.rb:238`                                      | Ruby `database.rb:198`                                                         | `rawConnection.pragma("encoding")` with a sync/async split (`sqlite3-adapter.ts:388-394`)                               | a `PRAGMA encoding` query                                                                                                                                                                                                                                                                                |
| `#rollback`                              | `sqlite3_adapter.rb:814`                                      | Ruby `database.rb:677`                                                         | absent from the seam                                                                                                    | an `exec("ROLLBACK")`                                                                                                                                                                                                                                                                                    |
| `#busy_handler_timeout=`                 | `sqlite3_adapter.rb:826`                                      | Ruby `database.rb:692`                                                         | absent; `timeout` is passed at open (`SqliteOpenConfig.timeout`)                                                        | better-sqlite3 `timeout` option only                                                                                                                                                                                                                                                                     |
| `#busy_handler`                          | `sqlite3_adapter.rb:832`                                      | C `database.c:983`                                                             | absent                                                                                                                  | **no client exposes `sqlite3_busy_handler`**; `retries` cannot be ported over any of the six. New gap, story `sqlite3-busy-handler-has-no-client-counterpart`                                                                                                                                            |
| `Pragmas#<name>=` via `public_send`      | `sqlite3_adapter.rb:839-840`                                  | Ruby `lib/sqlite3/pragmas.rb`                                                  | `sqlite/pragmas.ts` (ported) over `SqliteConnection.pragma` (`:43`)                                                     | `pragma()` (better-sqlite3) or `exec`                                                                                                                                                                                                                                                                    |
| `Statement#reset!`                       | `sqlite3/database_statements.rb:83`                           | C `ext/sqlite3/statement.c:684`                                                | absent; implicit in each client                                                                                         | `reset` (sql.js, libsql), implicit (better-sqlite3)                                                                                                                                                                                                                                                      |
| `Statement#bind_params`                  | `sqlite3/database_statements.rb:84,97`                        | Ruby `lib/sqlite3/statement.rb:52`; C `bind_param` `statement.c:683`           | `bindParams` (`sqlite-adapter.ts:23`)                                                                                   | `bind`                                                                                                                                                                                                                                                                                                   |
| `Statement#column_count`                 | `sqlite3/database_statements.rb:86,99`                        | C `statement.c:688`                                                            | `reader` (`:28`), a better-sqlite3 name                                                                                 | `columns().length`, `reader`                                                                                                                                                                                                                                                                             |
| `Statement#step`                         | `sqlite3/database_statements.rb:87,100`                       | C `statement.c:686`                                                            | `step` (`:24`)                                                                                                          | `run` / `step`                                                                                                                                                                                                                                                                                           |
| `Statement#columns`                      | `sqlite3/database_statements.rb:90,103`                       | Ruby `statement.rb:118`; C `column_name` `statement.c:689`                     | `columns()` returning `ColumnInfo[]`, mapped to names at the call site                                                  | `columns()`                                                                                                                                                                                                                                                                                              |
| `Statement#each` / `to_a`                | `sqlite3/database_statements.rb:90,103`                       | Ruby `statement.rb:123`; C `step`, `done?`                                     | `toA` (`:25`)                                                                                                           | `raw().all()`, `values()`                                                                                                                                                                                                                                                                                |
| `Statement#close`, `#closed?`            | `sqlite3/database_statements.rb:106`, `sqlite3_adapter.rb:98` | C `statement.c:681-682`                                                        | `close`, `closed` (`:29-30`)                                                                                            | `finalize`, tracked                                                                                                                                                                                                                                                                                      |
| `Constants::Open::SHAREDCACHE`           | `sqlite3_adapter.rb:473`                                      | C `ext/sqlite3/sqlite3.c:158`                                                  | `SQLite3Constants.Open.SHAREDCACHE` in `sqlite-adapter.ts:84`                                                           | none                                                                                                                                                                                                                                                                                                     |
| `BusyException` and the 25 other classes | `sqlite3_adapter.rb:705`                                      | Ruby `lib/sqlite3/errors.rb:4-87`; raised by C `ext/sqlite3/exception.c:3-122` | `sqlite/errors.ts` (ported; 5 receipts)                                                                                 | each client throws its own; `nativeStatus` recovers the code                                                                                                                                                                                                                                             |
| `ForkSafety.suppress_warnings!`          | `sqlite3_adapter.rb:18`                                       | Ruby `lib/sqlite3/fork_safety.rb:59`                                           | absent                                                                                                                  | JS has no `fork`; port as the no-op it is, or skip-group it                                                                                                                                                                                                                                              |

**Seam members the gem does not have**, which rule 1 removes or justifies:
`SqliteStatement.run` / `get` / `all` / `iterate` / `setReadBigInts` / `reader`;
`SqliteConnection.exec` / `pragma` / `isOpen` / `raw` / `lastInsertRowId`. Two are gem methods
Rails' adapter does not call (`Database#execute` `database.rb:247`, `#get_first_value` `:377`,
`#last_insert_row_id` `database.c:970`); each stays only if a trails call site outside the adapter
is named for it in the package README.

`setReadBigInts` is the one with a real job (`sqlite3-adapter.ts:1163-1171`, bigint columns) and no
gem counterpart: the gem returns Ruby Integers of any size. It stays as engine-private behaviour,
decided in `sqlite3-statement-class-carries-the-gem-surface`.

### Package shape

`packages/sqlite3/`, `@blazetrails/sqlite3`, mirroring `lib/sqlite3/`:

| gem                                                   | `packages/sqlite3/src/`                                                                          | from                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `lib/sqlite3/database.rb`, `ext/sqlite3/database.c`   | `database.ts`                                                                                    | `sqlite/database.ts` + the `SqliteConnection` interface |
| `lib/sqlite3/statement.rb`, `ext/sqlite3/statement.c` | `statement.ts`                                                                                   | the `SqliteStatement` interface                         |
| `lib/sqlite3/pragmas.rb`                              | `pragmas.ts`                                                                                     | `sqlite/pragmas.ts`, unchanged                          |
| `lib/sqlite3/errors.rb`, `ext/sqlite3/exception.c`    | `errors.ts`                                                                                      | `sqlite/errors.ts`                                      |
| `lib/sqlite3/constants.rb`, `ext/sqlite3/sqlite3.c`   | `constants.ts`                                                                                   | `SQLite3Constants` in `sqlite-adapter.ts:84-132`        |
| `lib/sqlite3/fork_safety.rb`                          | `fork-safety.ts`                                                                                 | new                                                     |
| (none)                                                | `engine/better-sqlite3.ts`, `engine/libsql.ts`, `engine/node-sqlite.ts`, `engine/expo-sqlite.ts` | `sqlite/*.ts`                                           |

- **`Database` and `Statement` are classes; the engine is the seam.** The gem's two classes are
  written once, over a small internal engine interface (open, prepare, bind, step, column names,
  finalize, changes, close: the private C functions in the table). Each npm client implements that
  interface, not the gem surface. This is where the six clients converge, and it shrinks each
  driver file: `withNullBinds`, column mapping and error translation are written once in
  `Statement`.
- **Subpath exports.** `"."` is the gem surface with no engine; `"./better-sqlite3"`, `"./libsql"`,
  `"./node-sqlite"`, `"./expo-sqlite"` each export an engine. Every npm client is an optional peer
  (`better-sqlite3`, `libsql`, `expo-sqlite`; `node:sqlite` is built in). The website's `sql.js`
  engine stays in `packages/website` and implements the exported engine type.
- **No empty seat.** `SQLite3::Database.new` takes its engine from the adapter's resolved driver,
  as `SQLite3Adapter.new_client` resolves one today (`resolveDriverFactory`,
  `sqlite3-adapter.ts:167`). The default is better-sqlite3; with it uninstalled and no other engine
  named, `new` is `LoadError`, Rails' `gem "sqlite3"; require "sqlite3"` arm
  (`sqlite3_adapter.rb:14-15`).
- **How this maps onto the `sqlite-drivers` lane.** One-to-one: each `*-adapter.ts` in
  `connection-adapters/` (`better-sqlite3-adapter.ts`, `libsql-adapter.ts`,
  `libsql-remote-adapter.ts`, `libsql-replica-adapter.ts`, `node-sqlite-adapter.ts`,
  `expo-sqlite-adapter.ts`) keeps its place and imports its engine from the package subpath
  instead of `../sqlite/`. The lane's matrix is unchanged. `sqlite-adapter.ts` loses everything but
  what the adapter itself needs.
- **Dependencies.** `@blazetrails/ruby-compat` only. `errors.ts` and the driver files import
  `ConfigurationError` from activerecord today (`sqlite/better-sqlite3.ts:4`); that edge is cut in
  the lift story, since a gem cannot raise a Rails error.

#### Async

The gem is synchronous. Of the six clients, four are synchronous (better-sqlite3, the local
`libsql` package, `node:sqlite`, `sql.js`) and two are not (expo-sqlite, libsql remote). The seam
today answers `T | Promise<T>` from every I/O member and offers `openSync` beside `open`.

"Async from the first PR" read strictly means `Database.new`, `prepare`, `execute_batch2`, `step`,
`each`, `close`, `rollback` and `encoding` return `Promise` on every engine. What that costs:

- `SQLite3Adapter.new_client` loses its synchronous arm (`sqlite3-adapter.ts:168-169`). Every
  SQLite connect becomes a pending open, the state
  in which `active?` must keep answering false (a past regression on this adapter), on the adapter the
  whole default test lane runs on.
- `encoding` (`sqlite3-adapter.ts:388-394`) loses its synchronous answer on sync engines and
  returns the UTF-8 fallback until first use, the behaviour
  `sqlite3-encoding-getter-returns-fallback-on-async-drivers` accepted for async drivers only.
- One microtask per `step` on the engine that does not need it.
- `changes`, `closed?`, `column_count` and `columns` are connection-local reads in the gem and
  stay synchronous on every engine; the two async engines already report them from the last
  result.

It does **not** collide with the three ratified sync surfaces directly. `toSql` and the
schema-cache peek need a synchronous _lease_, not synchronous driver I/O
(`withConnectionSync`, CLAUDE.md § "Schema reflection peeks at a warm cache", scope boundary), and
`SQLite3::Database.quote` is pure. The collision is narrower and is with § "The adapter lock
defaults to a monitor": that section records that `SQLite3Adapter#disconnectBang` closes the handle
under `lock` and that callers which do not await `lock.synchronize` depend on an uncontended entry
running its block before `synchronize` returns. A synchronous engine keeps that property for the
statement inside the block; a uniformly async wrapper gives it up on every engine. Whether any
caller depends on the statement, and not only the block entry, having completed is not something
this RFC could establish by reading. It is open question 1 and is not resolved here.

The stories are sized for the strict reading. What each answer changes, so the total is checkable
once the question is answered:

| story                                               | strict async (as filed) | union `T \| Promise<T>` | what differs                                                             |
| --------------------------------------------------- | ----------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `sqlite3-statement-class-carries-the-gem-surface`   | 500                     | 400                     | no sync-caller audit to act on                                           |
| `sqlite3-database-class-carries-the-gem-surface`    | 550                     | 450                     | `prepare`'s block form needs no settle-deferred `ensure` on sync engines |
| `sqlite3-better-sqlite3-engine`                     | 400                     | 300                     | no promise wrapper around a sync client                                  |
| `sqlite3-node-sqlite-engine`                        | 350                     | 250                     | same                                                                     |
| `sqlite3-libsql-engines`                            | 500                     | 400                     | same, for local and replica                                              |
| `sqlite3-website-sql-js-engine`                     | 250                     | 200                     | same                                                                     |
| `sqlite3-adapter-new-client-is-database-new`        | 300                     | 200                     | the `openSync` arm and the pending-open test stay as they are            |
| `sqlite3-adapter-perform-query-reads-the-gem-names` | 350                     | 300                     | `encoding` keeps its sync answer                                         |
| **RFC total**                                       | **5,740**               | **5,040**               |                                                                          |

`sqlite3-expo-sqlite-engine` and the other eight stories are the same size under either answer. The union
column is an estimate made at authoring time, not a measurement; the gate below is what replaces it
with one.

**The measurement is a gate.** `sqlite3-statement-class-carries-the-gem-surface` produces two
numbers before it converts anything: the `sqlite-mem` lane's wall time with promise-returning
`step` / `prepare` on better-sqlite3, and the list of callers that rely on a sync engine finishing
inside an un-awaited `lock.synchronize`. No story downstream of it (`Database`, the five engines,
`new_client`, `perform_query`, `configure_connection`) is claimed until those numbers are in its PR
and open question 1 is answered against them. The `deps` chain already enforces the order; this
paragraph is what makes it a decision point and not only a sequence.

### Registration cost

Smaller than pg's, because the vendor source and most parity enrollments exist.

1. `packages/sqlite3/package.json`, `tsconfig.json`, `README.md`; root `tsconfig.json`;
   `pnpm-lock.yaml`.
2. `vitest.config.ts` alias, and the website's prefix-matching alias (four subpaths).
3. `scripts/api-compare/config.ts`: **delete** `sqlite3: "activerecord"` from
   `PACKAGE_DIR_OVERRIDES` (`:46`) and `sqlite3: "sqlite"` from `PACKAGE_SRC_SUBDIR` (`:110`);
   `receipt-audit.ts:200`'s nested-package note; every `call-mismatches-exclude/`, pins and mark
   shard keyed `sqlite3/...` moves with its file (115 pins today).
4. `vendor/sources.ts`: the `sqlite3` entry gains `testPath: "test"`,
   and its comment stops saying the ports live in activerecord; `vendor/sources.test.ts` lists.
5. `scripts/test-compare/` (the four registrations) if the gem's `test/` is enrolled: see open
   question 4.
6. `.github/workflows/ci.yml` and `scripts/ci-suite-coverage.test.ts` fixtures: the five
   `*.trails.test.ts` driver suites leave the AR lanes for a lane of their own, which needs
   `better-sqlite3` and `libsql` built.
7. Subpath consumers: `packages/activerecord/package.json` peers,
   `dx-tests/tsconfig.json` and `virtualized-dx-tests/tsconfig.json` `paths`, the FileStore
   lock-worker resolve hook, and `packages/website`.
8. activerecord's own entry points that import the drivers for side effects:
   `test-setup-worker-db.ts:4`, `cases/helper.ts:1`, `support/template-global-setup.ts:4`,
   `support/sqlite-template.ts:2`.

### Migration

1. `sqlite3-lift-the-nested-port-into-a-package`: a move. No receipt changes; the four file covers
   and five `errors.ts` receipts move with their files.
2. `sqlite3-retire-the-0180-sqlite3-gem-story`: deletes the 3 receipts on `status2klass`,
   `rbSqlite3Raise`, `rbSqlite3RaiseWithSql`. They port `exception.c` under its C names and stay
   as unscored, unreceipted extra surface.
3. `sqlite3-database-class-carries-the-gem-surface` and
   `sqlite3-statement-class-carries-the-gem-surface`: the two classes over the engine interface.
4. One story per engine converting it from `SqliteDriver` to the engine interface; each removes
   that file's cover (4 receipts) and `nativeStatus` / `sqlite3Errmsg` fold into the engines (2 receipts).
5. `sqlite3-adapter-perform-query-reads-the-gem-names` and the other adapter call-site stories.
6. `sqlite3-retire-the-sqlite-driver-interfaces`: `sqlite-adapter.ts` loses the seam.

**The RFC 0180 story** `sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem`
(ready): proposed `tasks close` as superseded when this RFC goes active. Its criteria that score
the C surface are dropped with the extractor arm; the rest are step 4. Of the 9 receipts naming it,
3 are deleted and 6 are retagged onto the engine stories in the same change, since closing a story
cited in code reds `stale-refs`.
`sqlite-driver-adapter-subclasses-carry-file-level-covers` (0180) concerns the `*-adapter.ts`
subclasses, not the gem, and is untouched.

## Non-goals

- **The gem.** No `Backup`, `ResultSet`, `Value`, aggregates, `define_function`, collations,
  `load_extension`, `transaction` / `commit`, `interrupt`, or `VersionInfo`.
- **Changing the driver matrix.** Six engines in, six out.
- **Fixing `strict: false` on better-sqlite3.** The blocked story stays blocked on upstream; the
  wrapper is where its fix will go.
- **mysql2, Trilogy, `ActiveRecord::Promise`.**
- **New tooling, and scoring the C half.** No extractor arm and no citation lint, here or in
  RFC 0186 (`pg-gem-port`).

## Alternatives considered

- **Leave it nested.** Cheapest. Keeps the shape RFC 0184 says is being undone, and keeps the
  browser path importing activerecord for the seam.
- **Enroll `ext/sqlite3/*.c` through a C extractor arm.** The original plan. Rejected by the owner
  with the arm itself (RFC 0186 § "Alternatives considered"): scoring only, no behaviour change.
- **Each client implements `Database` / `Statement` directly, no engine interface.** Six copies of
  `bind_params`, `each` and the error mapping; the current state under new names.
- **Keep `T | Promise<T>`.** What the code does now. It is the honest type of a wrapper over
  mixed clients and costs the adapter nothing; it is also not "async from the first PR". Open
  question 1.

## Rollout

No story here depends on RFC 0186. `sqlite3-enroll-the-c-extension-surface` was the one edge; it
is closed with the extractor arm it needed.

1. Package: `sqlite3-lift-the-nested-port-into-a-package`,
   `sqlite3-constants-and-fork-safety-ports`.
2. Classes: `sqlite3-database-class-carries-the-gem-surface`,
   `sqlite3-statement-class-carries-the-gem-surface`.
3. Engines: `sqlite3-better-sqlite3-engine`, `sqlite3-node-sqlite-engine`,
   `sqlite3-libsql-engines`, `sqlite3-expo-sqlite-engine`, `sqlite3-website-sql-js-engine`.
4. Adapter: `sqlite3-adapter-perform-query-reads-the-gem-names`,
   `sqlite3-adapter-new-client-is-database-new`,
   `sqlite3-adapter-configure-connection-calls-the-gem-setters`,
   `sqlite3-busy-handler-has-no-client-counterpart`.
5. Close-out: `sqlite3-score-only-what-activerecord-calls`,
   `sqlite3-retire-the-sqlite-driver-interfaces`,
   `sqlite3-gem-tests-enroll-in-parity-test`, `sqlite3-retire-the-0180-sqlite3-gem-story`.

## Verification

- `ls packages/activerecord/src/sqlite` fails; `grep -n "sqlite3" scripts/api-compare/config.ts`
  shows no `PACKAGE_DIR_OVERRIDES` / `PACKAGE_SRC_SUBDIR` row.
- `pnpm parity:api` prints `sqlite3` with a missing count of 0: the 11 Ruby-defined methods in the
  split table have rows, every gem method activerecord does not call is skipped or its file listed
  unported, and the 9 C-defined ones are unscored.
- `grep -rn "sqlite3-gem-c-surface-and-driver-covers" packages/` returns nothing (9 today).
- `grep -n "interface Sqlite\|interface SyncSqlite" packages/activerecord/src/sqlite-adapter.ts`
  returns nothing (7 today: `SqliteStatement`, `SqliteConnection`, `SyncSqliteStatement`,
  `SyncSqliteConnection`, `SqliteOpenConfig`, `SqliteDriverCapabilities`, `SqliteDriver`).
- `sqlite3/database-statements.ts`'s `performQuery` has no `@missingRailsCall` and no call-gate row
  for `execute_batch2`, `reset!`, `column_count`, `to_a`.

## Open questions

1. **Uniformly async, or `T | Promise<T>`?** Strictly async costs the sync open, the sync
   `encoding`, and a microtask per `step` on four of six engines, and may touch the uncontended-entry
   property § "The adapter lock defaults to a monitor" depends on. Does "async from the first PR"
   mean every I/O method returns `Promise` on every engine, or that the surface is awaitable from
   the first PR (the union it has now)?
2. **`busy_handler`.** No client exposes it, so `retries` (`sqlite3_adapter.rb:829-833`) is
   unportable over any of the six. File it as blocked on upstream, or emulate with a retry loop in
   the engine (behaviour the gem does not have)?
3. **`setReadBigInts`.** No gem counterpart; needed because JS numbers are not Ruby Integers. Keep
   as engine-private state the adapter toggles through a receipted method, or always read bigints
   and narrow in the adapter?
4. **The gem's tests.** `vendor/sqlite3/v2.6.0/test/` is 20 Minitest files, mostly outside the 20
   methods. Enroll `parity:test` for the files that cover them (`test_database.rb`,
   `test_statement.rb`, `test_pragmas.rb`, `test_integration_statement.rb`), or leave the package
   measured by `parity:api` and its `*.trails.test.ts` suites only?
5. **`Database#execute`, `#get_first_value`, `#last_insert_row_id`.** Gem methods Rails' adapter
   never calls but trails' seam has. Keep each only where a non-adapter call site is named, or
   drop all three and have the adapter issue `SELECT last_insert_rowid()` as Rails does?
6. **Order against pg.** Resolved 2026-10-08: there is no ordering. With the C arm gone this RFC
   needs nothing from RFC 0186.

## Changelog

- 2026-10-08: initial draft
- 2026-10-08: numbered 0187; the dependency on RFC 0186's extractor story is wired in `deps` and `related-rfcs`, and the prose that asked for it is replaced
- 2026-10-08: review round 1 (tasks#261): busy-handler and `new_client` added to the deps of the stories that need them; the 0180 retag story depends on the lift and names receipts by symbol; § Async lists est-loc under each answer to open question 1 and makes the measurement a gate; § Rollout states the pg RFC dependency and the fallback; interface count corrected to 7
- 2026-10-08: self-review round 1: corrected the `errors.ts` receipt split (3 C ports, 2 invented helpers); sections regrouped under `## Design` to match the template
- 2026-10-08: owner decision, following RFC 0186: no C extractor arm. The package stays and its C half is unscored and ungated; `sqlite3-enroll-the-c-extension-surface` closed; the 3 `exception.c` receipts are deleted by the 0180 retire story instead of retagged; open question 6 resolved
- 2026-10-08: owner decision: the score's denominator is the methods activerecord calls; story `sqlite3-score-only-what-activerecord-calls` added
