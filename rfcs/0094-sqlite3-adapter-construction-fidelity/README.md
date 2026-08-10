---
rfc: "0094-sqlite3-adapter-construction-fidelity"
title: "SQLite3 adapter construction fidelity"
status: draft
created: 2026-08-09
updated: 2026-08-09
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
---

# SQLite3 adapter construction fidelity

## Summary

Converge `SQLite3Adapter`'s **construction path** — `initialize`,
`build_statement_pool`, `configure_connection`, `connect`/`reconnect` and
`database_exists?` — onto
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`.

Rails' `initialize` (`sqlite3_adapter.rb:102-133`) does no I/O: it validates and
expands the database path, creates the parent directory, resolves `:strict`, and
builds `@connection_parameters`. The handle is opened later by `connect`, the
statement pool is built by `AbstractAdapter#initialize` after the config is in
hand (`abstract_adapter.rb:156`), and the pragmas are applied by
`configure_connection` _after_ `check_version`.

trails' constructor
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:355-406`) does
all of it at once, in the wrong order, with a fire-and-forget promise at the end.
Every story below is a consequence of that single shape, which is why they belong
together: fixing any one in isolation either regresses another or gets blocked by
it (#6226 and #6098 each hit this).

## Motivation — one root cause, five symptoms

`this.connect()` at `sqlite3-adapter.ts:400` opens (and therefore **creates**) the
database file during construction. Downstream:

1. **`database_exists?` cannot be inherited.** Rails' base
   `self.database_exists?(config)` is `new(config).database_exists?`
   (`abstract_adapter.rb:357-360`) — safe there precisely because `initialize`
   touches nothing. In trails that would answer `true` for every path, so
   `AbstractSQLite3Adapter` carries a config-reading `static databaseExists`
   override (`sqlite3-adapter.ts:1504`) with no Rails counterpart.
2. **The statement pool is built too early.** `private _statementPool =
this.buildStatementPool()` (`:330`) is a field initializer, so it runs before
   the constructor reads `statement_limit`, forcing a `setMaxSize` re-entry
   (`:396`) Rails does not have (`sqlite3_adapter.rb:803` reads the limit at
   build time).
3. **`configure_connection` is fire-and-forget** (`:404`), so `check_version`'s
   rejection on a too-old SQLite becomes an unhandled rejection instead of an
   error out of construction, and the sync-driver branch has to run pragmas
   _before_ the version check to stay inside the constructor's turn — inverting
   `sqlite3_adapter.rb:835-841`.
4. **`@connection_parameters` is never built.** Rails' `initialize` ends by
   merging `results_as_hash: true` and `default_transaction_mode: :immediate`
   into the config (`sqlite3_adapter.rb:128-132`); trails has no such member on
   any adapter, so `connect` re-derives driver arguments ad hoc.
5. **The constructor has a second, non-Rails signature.** The deprecated
   positional `(filename, options)` overload (`:353`) is the form 156 of 174
   call sites use, which is why the Rails-shaped hash constructor keeps being
   treated as the alternate.

## Scope

**In scope** — exactly these Rails methods, and nothing else:

| Rails                                                                                             | trails                                                           |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `SQLite3Adapter#initialize` (`sqlite3_adapter.rb:102-133`)                                        | `sqlite3-adapter.ts:355-406`                                     |
| `#build_statement_pool` (`:803`)                                                                  | `buildStatementPool` / `_statementPool` (`:330`)                 |
| `#configure_connection` (`:820-841`)                                                              | `configureConnection` (`:2830-2880`)                             |
| `#connect` / `#reconnect` (`:846-861`)                                                            | `connect` (`:400`, `:1423`)                                      |
| `#database_exists?` (`:135-137`) + `AbstractAdapter.database_exists?` (`abstract_adapter.rb:357`) | instance method + the `static databaseExists` override (`:1504`) |
| `DEFAULT_PRAGMAS` (`:84-91`)                                                                      | absent; open-coded in `configureConnection`                      |

**Explicitly out of scope** (each has its own owner; findings there go to that
RFC, not this one):

- Statement execution, `raw_execute`, the `alterTable` table-rebuild path and its
  instrumentation → RFC 0076.
- Quoting and bind formatting → RFC 0077.
- Type-map construction and column reflection.
- Transaction semantics and `default_transaction_mode` _behaviour_ (this RFC only
  puts the key into `@connection_parameters` where Rails puts it).
- `:memory:` vs file-backed **test** strategy — settled separately; this RFC does
  not change what the suite connects to.

## Bounded by construction

**This RFC has exactly six stories, enumerated below. It does not accept new
ones.** A SQLite finding that is not one of the six is out of scope by
definition: file it against `0023-surfaced-deviations` and let triage place it.
This is deliberate — the four stories this RFC was assembled from sat in 0023 for
weeks precisely because no one could tell where the cluster ended.

1. `sqlite3-constructor-connects-eagerly-unlike-rails` (~200 LOC) — the root
   cause. Construction stops opening the handle; `static databaseExists` is
   deleted and the base inherited.
2. `sqlite3-statement-pool-built-before-config-read` (~40 LOC) — pool assigned
   once, in the constructor, after the config keys are read.
3. `sqlite-configure-connection-pragmas-precede-check-version` (~90 LOC) —
   `check_version` before the pragmas on every driver path; a too-old SQLite
   throws out of construction.
4. `sqlite-pragmas-option-validation-diverges-from-rails` (~60 LOC) — merge over
   a real `DEFAULT_PRAGMAS`, gate on whether the pragma exists rather than a name
   regex, Rails' `Unknown SQLite pragma:` message.
5. `sqlite3-connection-parameters-never-built` (~90 LOC) — build
   `@connection_parameters` where Rails builds it and have `connect` consume it.
6. `retire-sqlite3-positional-constructor-overload` (~350 LOC, mechanical) — one
   Rails-shaped hash constructor; 156 positional call sites converted.

## Ordering

1 is the root cause and unblocks 3 and 5; 2 and 4 are independent and can land in
any order. 6 is mechanical and should land **last**, after the hash constructor is
the only shape that has to be correct — doing it earlier means converting 156 call
sites twice.

## Done when

- `SQLite3Adapter`'s constructor body reads statement-for-statement against
  `sqlite3_adapter.rb:102-133`: no `connect()`, no `configureConnection()`, no
  `setMaxSize` re-entry, no second signature.
- `AbstractSQLite3Adapter.databaseExists` (the static override) is gone and
  `test_database_exists_returns_false_when_the_database_does_not_exist` passes
  through the inherited base without creating the file it asks about.
- `configure_connection` runs `check_version` before the pragmas on every driver
  path, and a too-old SQLite surfaces as a thrown error, not an unhandled
  rejection.
- `pnpm parity:api:extra --package activerecord` shows no SQLite construction-path extra
  surface; `pnpm parity:api:calls` green.
- Green on all three lanes (the sqlite3 lane is where this is observable; pg and
  mysql2 must be unaffected).

Then this RFC closes. It is not a standing bucket.
