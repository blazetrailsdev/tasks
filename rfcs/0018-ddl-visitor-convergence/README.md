---
rfc: "0018-ddl-visitor-convergence"
title: "Converge all CREATE TABLE DDL onto the SchemaCreation visitor — eliminate hand-rolled TableDefinition#toSql"
status: closed
created: 2026-06-08
updated: 2026-06-20
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - ddl-visitor-convergence
related-rfcs:
  - "0010-adapter-cleanup"
  - "0013-pg-rawconn-convergence"
---

<!-- Unnumbered until merge: keep `rfc:` as 0018-ddl-visitor-convergence and the H1
     below number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC 0018 — Converge all CREATE TABLE DDL onto the SchemaCreation visitor

## Summary

`AbstractTableDefinition.toSql()` is a ~260-line hand-rolled `CREATE TABLE` SQL
generator with ~19 `_adapterName` branches that duplicates the logic in the
`SchemaCreation` visitor hierarchy. Rails' `TableDefinition` generates no SQL —
`SchemaCreation` is the single source of truth. Today, `MigrationContext.createTable`
(the test framework's primary schema builder) still routes through `td.toSql()` for
SQLite and PostgreSQL, producing behaviorally inconsistent DDL vs the
`SchemaStatements.createTable` visitor path and containing both dead code (nine
MySQL-specific branches unreachable since `MysqlTableDefinition.toSql()` never calls
`super`) and real behavioral gaps. This RFC proposes eliminating `toSql()` by routing
all adapters' `toSql()` calls through their `SchemaCreation` visitors, matching the
Rails design.

## Motivation

### The two generators

All `CREATE TABLE` DDL in the codebase flows through one of two paths:

| Path                           | File:line                           | Generator used                                        |
| ------------------------------ | ----------------------------------- | ----------------------------------------------------- |
| `SchemaStatements.createTable` | `abstract/schema-statements.ts:169` | **Visitor**: `this.schemaCreation.accept(td)`         |
| `MigrationContext.createTable` | `migration.ts:1935`                 | **`td.toSql()`** → dialect-specific below             |
| `Migration.createTable`        | `migration.ts:611`                  | Delegates to `SchemaStatements.createTable` → visitor |

`MigrationContext.createTable` calls `this.connection.createTableDefinition!(name, ...)` to
get a dialect-specific `TableDefinition`, then `this.connection.toSql(td)`. The `toSql`
function (`abstract/database-statements.ts:174`) dispatches to `td.toSql()` because
`TableDefinition` has that method.

### What `td.toSql()` actually calls today

| Adapter TD class                                                      | `toSql()` behavior                                                                                          |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `mysql/TableDefinition` (`mysql/schema-definitions.ts:95`)            | Calls `MysqlSchemaCreation.accept(this)` → **visitor** ✓                                                    |
| `postgresql/TableDefinition` (`postgresql/schema-definitions.ts:249`) | Calls `super.toSql()` (hand-rolled) + regex for `UNLOGGED` + string splice for exclusion/unique constraints |
| `sqlite3/TableDefinition` (`sqlite3/schema-definitions.ts:13`)        | No `toSql()` override → inherits `AbstractTableDefinition.toSql()` → **hand-rolled** ✗                      |

Note: `PgTableDefinition.toSql()` calls the **hand-rolled** `super.toSql()` rather
than the visitor. The visitor handles `UNLOGGED` (via `tableModifierInCreate` override)
and exclusion/unique constraints (via `tableConstraintStatements` override) — both are
already wired in `PgSchemaCreation`. The `toSql()` override therefore duplicates this
handling via regex and string splicing rather than delegating to the visitor.

### Dead code in `AbstractTableDefinition.toSql()`

Because `MysqlTableDefinition.toSql()` never calls `super.toSql()`, nine
MySQL-specific branches in the hand-rolled method are **unreachable** for the MySQL
adapter. They execute for SQLite and PG (with `_adapterName === "mysql"` evaluating
false), but produce no output. As of commit `d593b419a` (2026-06-08), which routed
`MigrationContext.createTable` through `connection.createTableDefinition!`, the MySQL
column-COMMENT branch was already removed from `toSql()`.

Dead-for-MySQL branches in `abstract/schema-definitions.ts:toSql()` (current `main`):

| Lines     | Branch                                                                   | Status         |
| --------- | ------------------------------------------------------------------------ | -------------- |
| 1077      | `_adapterName === "mysql"` → `"BIGINT AUTO_INCREMENT PRIMARY KEY"`       | Dead           |
| 1086      | `_adapterName === "mysql"` → `"CHAR(36)"` (uuid)                         | Dead           |
| 1179–1190 | `_adapterName === "mysql"` per-column charset/collation                  | Dead           |
| 1193–1195 | `_adapterName !== "postgres"` throw for array columns                    | Dead for MySQL |
| 1208–1214 | `_adapterName !== "postgres"` throw for generated columns in createTable | Dead for MySQL |
| 1249–1251 | `_adapterName === "mysql"` CTAS with inline indexes                      | Dead           |
| 1293–1297 | `_adapterName === "mysql"` inline indexes in column list                 | Dead           |
| 1301–1309 | `_adapterName === "mysql"` table-level charset/collation                 | Dead           |
| 1312–1315 | `_adapterName === "mysql"` table-level COMMENT                           | Dead           |

That's **9** dead-for-MySQL code paths. All are handled correctly by
`MysqlSchemaCreation.visitTableDefinition` / `addTableOptionsBang` / `addColumnOptionsBang`.

### Behavioral gaps between the two generators

Because `MigrationContext.createTable` on SQLite and PG still hits the hand-rolled
path, there are real behavioral differences vs `SchemaStatements.createTable`:

| Feature                                     | Hand-rolled (`toSql()`)                                                    | Visitor (`SchemaCreation`)                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **`NOT NULL` / `DEFAULT` order**            | `NOT NULL` **before** `DEFAULT`                                            | `DEFAULT` then `NOT NULL` (Rails order)                                                 |
| **SQLite generated columns in createTable** | **Throws** (`as:` not wired for SQLite)                                    | Works: `SQLite3SchemaCreation.addColumnOptions` handles `opts["as"]`                    |
| **SQLite FK deferrable**                    | **Throws** ("only supported on PostgreSQL")                                | Works: `SQLite3SchemaCreation.visitForeignKeyDefinition` appends `DEFERRABLE INITIALLY` |
| **PG column-level collation**               | Silently **dropped** (only sqlite/mysql have collation in the column loop) | Handled: `PgSchemaCreation.addColumnOptionsBang` appends `COLLATE "x"`                  |
| **`datetime` default precision**            | Defaults `undefined` → `6` → `DATETIME(6)`                                 | No default; emits bare `DATETIME`                                                       |

The `DEFAULT`/`NOT NULL` ordering is the most pervasive gap — Rails and the visitor emit
`DEFAULT` before `NOT NULL`, but the hand-rolled path does the reverse.

### Root cause: `AbstractTableDefinition.toSql()` is a trails-only artifact

Rails' `TableDefinition` has no `to_sql` method and generates no SQL. The
`SchemaCreation` visitor is the sole SQL generator:
`activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb`. The
hand-rolled `toSql()` was introduced early in the port before the visitor hierarchy was
complete, then partially superseded by visitor subclasses — leaving a parallel
implementation.

### Why `MigrationContext` has its own `createTable`

`MigrationContext` (`migration.ts:1636`) is a trails-specific test-framework schema
manager, not a full Rails migration engine. It is used by `defineSchema` / `loadSchema`
to build test schemas in-process. It maintains state maps (`_tables`, `_columns`,
`_columnMeta`, `_indexes`) to support fast synchronous `tableExists` / `columnExists`
lookups without round-tripping to the DB. Its `createTable` needs to:

1. Generate + execute the DDL
2. Populate those state maps from `td.columns`

That is why it doesn't simply delegate to `Migration.createTable`, which records
operations for reversibility and doesn't expose `td.columns` post-execution. The
state-tracking concern is separate from the DDL-generation concern.

## Design

### End state

`AbstractTableDefinition.toSql()` is deleted. Every CREATE TABLE SQL string is
produced by one path: `SchemaCreation.visitTableDefinition`. The chain for all adapters:

```text
MigrationContext.createTable  →  connection.createTableDefinition!  →  dialect TD
                              →  connection.toSql(td)               →  td.toSql()
                                                                    →  dialect SchemaCreation.accept(this)
                                                                    →  visitor
```

```text
SchemaStatements.createTable  →  adapter.createTableDefinition!  →  dialect TD
                              →  schemaCreation.accept(td)        →  visitor
```

### Step 1 — Delete dead MySQL branches from `AbstractTableDefinition.toSql()` (≤ 40 LOC)

Remove the nine dead-for-MySQL `_adapterName === "mysql"` branches from the hand-rolled
`toSql()`. No behavior change for any adapter — these branches are unreachable for
MySQL (its `toSql()` overrides to the visitor), and evaluate `false` for SQLite/PG.

Files touched: `abstract/schema-definitions.ts` only.

This step is safe, small (deleting ~40 lines), and immediately reduces the noise that
makes the remaining live branches harder to read.

### Step 2 — Wire SQLite to use the visitor (≤ 120 LOC)

SQLite already has `sqlite3/schema-creation.ts` (with `addColumnOptions` handling
collation + generated columns, and `visitForeignKeyDefinition` handling deferrable) and
`sqlite3/schema-definitions.ts` (a `TableDefinition` subclass). Neither is connected:

- `SQLite3Adapter` has no `createTableDefinition` override → falls through to the
  mixin's `SchemaStatements.createTableDefinition`, which returns a base
  `AbstractTableDefinition`. The `createTableDefinition` function in
  `sqlite3/schema-statements.ts:132` that creates a `SQLite3TableDefinition` is
  `@internal`, not exported, and **never called** — dead code.
- `SQLite3TableDefinition` has no `toSql()` override.

Two sub-steps:

**2a — Add `SQLite3Adapter.createTableDefinition` override** that returns a
`new SQLite3TableDefinition(name, options)`, mirroring
`AbstractMysqlAdapter.createTableDefinition` and
`PostgreSQLAdapter.createTableDefinition`. Define this directly on the adapter class
(in `sqlite3-adapter.ts`). The dead internal `createTableDefinition` function at
`sqlite3/schema-statements.ts:132` has the same body and should be deleted rather
than promoted — it is `@internal`, never exported, and never called.

**2b — Add `SQLite3TableDefinition.toSql()` override** that calls
`SQLite3SchemaCreation.accept(this)`, analogous to
`MysqlTableDefinition.toSql()`. The `SQLite3Adapter` exposes a `schemaCreation` getter
(`sqlite3-adapter.ts:126`) but we need the visitor to use the adapter's quoter; pass
`this._adapter` (the quoting adapter reference) when constructing the visitor.

After step 2, `MigrationContext.createTable` on SQLite routes:

```text
SQLite3TableDefinition.toSql()
  → new SQLite3SchemaCreation("sqlite", adapter).accept(this)
  → visitTableDefinition → visitColumnDefinition → addColumnOptionsBang
```

This fixes: SQLite generated columns, FK deferrable, column collation ordering,
`DEFAULT`/`NOT NULL` order, datetime precision default.

Test targets: run `pnpm vitest run` on `sqlite3/schema-definitions.test.ts`,
`sqlite3/schema-creation.test.ts`, and `abstract/schema-definitions.test.ts`.
Verify that `defineSchema` / `loadSchema` still work on the SQLite test suite by
running a representative sample (e.g. `migration/schema.test.ts`,
`adapters/sqlite3/copy-table.test.ts`).

### Step 3 — Fix PG `toSql()` to call the visitor (≤ 80 LOC)

Change `postgresql/schema-definitions.ts:PgTableDefinition.toSql()` from:

```typescript
override toSql(): string {
    let sql = super.toSql();           // ← hand-rolled (misses PG column collation)
    if (this.unlogged) { sql = sql.replace(...); }  // ← regex
    if (...) { sql = this.appendConstraintsToSql(sql, ...); }  // ← string splice
    return sql;
}
```

to:

```typescript
override toSql(): string {
    return new PgSchemaCreation(this._adapter).accept(this);
}
```

`PgSchemaCreation` already handles everything needed:

- `UNLOGGED` via `tableModifierInCreate` override (`postgresql/schema-creation.ts:345`)
- Exclusion/unique constraints via `tableConstraintStatements` override (`postgresql/schema-creation.ts:326`)
- FK `NOT VALID` / deferrable via `visitForeignKeyDefinition` override
- Check constraint `NOT VALID` via `visitCheckConstraintDefinition` override
- Column collation via `addColumnOptionsBang` override
- UUID PRIMARY KEY with `DEFAULT gen_random_uuid()` via `addColumnOptionsBang` override
- `GENERATED ALWAYS AS ... STORED` via `_pgGeneratedClause` in `addColumnOptionsBang`

The `appendConstraintsToSql` / `tableElementListRange` private methods and the
`appendConstraintsToSql`-related code in `toSql()` become dead and can be deleted.

`PgTableDefinition` stores a reference to the host adapter as `_adapter`
(`postgresql/schema-definitions.ts` constructor). Pass it to `new PgSchemaCreation(this._adapter)`.

Behavioral note: `PgSchemaCreation.typeToSql` delegates to `this.adapter.typeToSql`
(which routes through `PostgreSQLAdapter.typeToSql` → `nativeDatabaseTypesOverrides`).
The hand-rolled path's `typeToSql` inline is a simplified version that does not route
there. Step 3 therefore requires verifying that the `PgSchemaCreation.typeToSql` chain
produces the same types for all the PG-specific types used in `createTable` context
(e.g. `primary_key` → `SERIAL PRIMARY KEY` is handled by the base fallback in
`PgSchemaCreation.typeToSql:88` which calls `super.typeToSql` for `"primary_key"`).

Test targets: `postgresql/schema-definitions.test.ts` (its `toSql()` tests call the
method directly and assert specific strings — many will need updating to reflect the
visitor's behavior, especially `DEFAULT`/`NOT NULL` ordering). Run the PG adapter dir
at `AR_DB_FORKS=1` (see RFC 0013 §Test-isolation gotcha): `RUN_ADAPTER_DIRS=1
PG_TEST_URL=... AR_DB_FORKS=1 pnpm vitest run`.

### Step 4 — Delete `AbstractTableDefinition.toSql()` (≤ 30 LOC)

Once steps 2 and 3 land on `main`, `AbstractTableDefinition.toSql()` is:

- Never called by MySQL (overridden in `MysqlTableDefinition`)
- Never called by PG (overridden in `PgTableDefinition` to call the visitor)
- Never called by SQLite (overridden in `SQLite3TableDefinition` to call the visitor)

The remaining callers:

- `abstract/schema-definitions.test.ts:89–99` — tests blank-type guard in `toSql()`;
  the same guard should be verified in the visitor's `visitColumnDefinition` or moved
  to `newColumnDefinition` on the base TD
- Any test directly asserting `new TableDefinition(...).toSql()` must be migrated to
  the visitor path

After deletion: the blank-type guard in `visitColumnDefinition` (or `typeToSql`) must
cover it. Rails raises `ArgumentError("invalid column type:")` from `type_to_sql`;
the equivalent check belongs in `SchemaCreation.typeToSql` or the abstract
`visitColumnDefinition`.

Also required in this step: `migration.ts:MigrationContext.createTable` currently
calls `this.connection.toSql(td)`, which routes through `database-statements.ts:174`'s
`typeof (node as any).toSql === "function"` check. Once `toSql()` is removed from
`AbstractTableDefinition` that check returns `false` and the call errors at runtime.
`MigrationContext.createTable` must be updated to call the visitor directly, e.g.:

```typescript
await this.connection.executeMutation(this.connection.schemaCreation.accept(td));
```

This is the final cleanup that makes `MigrationContext.createTable`'s DDL path
structurally identical to `SchemaStatements.createTable`.

Files touched: `abstract/schema-definitions.ts` (delete method + dead helpers),
`abstract/schema-definitions.test.ts` (migrate tests),
`abstract/schema-creation.ts` (blank-type guard),
`abstract/schema-creation.test.ts` (blank-type guard test),
`migration.ts` (`MigrationContext.createTable` visitor call).

### Blast radius

`MigrationContext.createTable` is the test framework's primary schema builder — it is
invoked by `defineSchema` and `loadSchema` for essentially every test that touches the
DB. Any DDL difference breaks those tests.

The behavioral gaps listed in §Motivation (DEFAULT/NOT NULL order, datetime precision,
etc.) mean **some tests will change output after steps 2–3** — those tests were silently
asserting the wrong Rails behavior. This is a feature, not a bug: post-convergence, the
test framework's DDL matches what a real `SchemaStatements.createTable` call would
produce.

Concrete expected output changes:

- SQLite columns with `null: false` and `default:`: will flip from `NOT NULL DEFAULT x`
  to `DEFAULT x NOT NULL` (Rails order)
- SQLite `datetime` columns without explicit precision: will drop the `(6)` suffix
- SQLite `createTable` with generated columns: previously threw; now emits `GENERATED ALWAYS AS`
- PG columns with column-level collation: previously silent drop; now emits `COLLATE "x"`

### Validation plan

Per CLAUDE.md, do NOT run the full test suite. Run only the files directly touched:

| Phase  | Test files                                                                                                                                 | Command                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Step 1 | `abstract/schema-definitions.test.ts`                                                                                                      | `pnpm vitest run packages/activerecord/src/connection-adapters/abstract/schema-definitions.test.ts` |
| Step 2 | `sqlite3/schema-definitions.test.ts`, `sqlite3/schema-creation.test.ts`, `abstract/schema-definitions.test.ts`, `migration/schema.test.ts` | As above per file                                                                                   |
| Step 3 | `postgresql/schema-definitions.test.ts`, `postgresql/schema-creation.test.ts`                                                              | As above; also PG adapter dir at `AR_DB_FORKS=1`                                                    |
| Step 4 | All of the above                                                                                                                           | As above                                                                                            |

For steps 2–3, validate against live DBs:

```bash
# MySQL:8
MYSQL_TEST_URL=mysql2://root:root@127.0.0.1:13306/activerecord_unittest \
  TEST_ADAPTER=mysql2 AR_DB_FORKS=1 RUN_ADAPTER_DIRS=1 \
  pnpm vitest run packages/activerecord/src/connection-adapters/mysql2-adapter.test.ts

# PostgreSQL:17 (see docker-compose.yml for port)
PG_TEST_URL=postgresql://root:password@localhost:15432/activerecord_unittest \
  TEST_ADAPTER=postgresql AR_DB_FORKS=1 RUN_ADAPTER_DIRS=1 \
  pnpm vitest run packages/activerecord/src/connection-adapters/postgresql-adapter.test.ts
```

The `.github/workflows/ci.yml` `ARCONN` env var gates adapter-dir tests — Step 3 in
particular should target representative adapter dirs (`adapters/postgresql/schema`,
`adapters/postgresql/active-schema`, `adapters/postgresql/change-schema`).

## Alternatives considered

- **Delete only the dead MySQL branches (Step 1 only).** This is a subset of the full
  proposal. It reduces noise and is zero-risk, but leaves the SQLite and PG behavioral
  gaps open and the hand-rolled generator alive. Recommended as a fast follow-on if
  the full RFC is blocked, but not sufficient on its own.

- **Leave `PgTableDefinition.toSql()` calling `super.toSql()` (visitor for SQLite only).**
  Fixes the SQLite gaps but leaves PG column-collation drop and the
  `DEFAULT`/`NOT NULL` inversion for PG tests. The two paths continue to diverge in
  subtle ways, which is confusing and error-prone. Rejected — the full convergence is
  worth the extra step.

- **Change `MigrationContext.createTable` to call `schemaCreation.accept(td)` directly**
  (bypassing `td.toSql()` entirely), without modifying the dialect TDs. This makes
  `MigrationContext` consistent with `SchemaStatements.createTable` and fixes all
  behavioral gaps. However, it leaves `AbstractTableDefinition.toSql()` alive and callable
  via `this.connection.toSql(td)` in other contexts (future callers could still hit the
  hand-rolled path). The dialect-`toSql()`-via-visitor approach is strictly better: it
  eliminates the escape hatch for all callers, not just `MigrationContext`.

- **Delegate `MigrationContext.createTable` entirely to `SchemaStatements.createTable`.**
  Would require introspecting the schema after each `createTable` call to populate
  `_columns` state, adding latency and complexity. The current design of reading
  `td.columns` is cleaner. Rejected — the DDL generation fix is in the visitor routing,
  not in the ownership boundary.

## Rollout

Steps are ordered by risk/blast-radius; Steps 1–2 can land without live-DB validation.
Step 3 requires PG adapter-dir validation. All steps branch from `main`; no stacking.

1. Step 1 — [step1-delete-dead-mysql-branches](stories/step1-delete-dead-mysql-branches.md):
   delete 9 dead-for-MySQL branches from `AbstractTableDefinition.toSql()`. ~40 LOC.
2. Step 2 — [step2-sqlite-visitor-wire](stories/step2-sqlite-visitor-wire.md):
   `SQLite3Adapter.createTableDefinition` override + `SQLite3TableDefinition.toSql()`
   → visitor. ~120 LOC.
3. Step 3 — [step3-pg-tosql-via-visitor](stories/step3-pg-tosql-via-visitor.md):
   `PgTableDefinition.toSql()` calls `PgSchemaCreation.accept(this)` instead of
   `super.toSql()` + regex/splice. ~80 LOC.
4. Step 4 — [step4-delete-abstract-tosql](stories/step4-delete-abstract-tosql.md):
   delete `AbstractTableDefinition.toSql()`. ~30 LOC net (delete + migrate tests).

## Open questions

1. **`datetime` default precision of 6 for SQLite.** The hand-rolled path defaults
   `datetime` precision to `6` when `undefined` (mimicking Rails' MySQL behavior of
   defaulting to 6), emitting `DATETIME(6)`. The visitor emits bare `DATETIME`. SQLite
   silently ignores precision; both are valid SQL. Which is preferable? The visitor
   path (no precision) matches Rails' SQLite3 `register_class_with_limit` behavior
   (which does not add precision for DATETIME). **Recommendation**: follow the visitor
   (no default precision) — it matches Rails and is simpler.

2. **`AbstractTableDefinition.toSql()` blank-type guard** (`abstract/schema-definitions.ts:1161`
   — throws when `col.type` is empty/blank). Does this guard need to move to the
   visitor's `visitColumnDefinition` or `typeToSql`? The visitor's `typeToSql` `default`
   case emits `String(type).toUpperCase()` which would silently emit an empty string for
   blank types. **Recommendation**: add the blank-type guard to `SchemaCreation.typeToSql`
   before deleting `toSql()`.

3. **`sqlite3/schema-statements.ts:132`'s dead `createTableDefinition` function.**
   Step 2 should re-export or promote it. Is it cleaner to promote the existing
   internal function or write a fresh override on `SQLite3Adapter`? The former keeps
   Rails' module-function style; the latter is more consistent with MySQL and PG.
   **Recommendation**: follow the MySQL/PG pattern — define the method directly on
   `SQLite3Adapter`, and delete the dead internal function in `schema-statements.ts`.

## Prompt accuracy notes

The following claims in the RFC-authoring prompt were inaccurate against the current
codebase (as of `main` @ `d593b419a`, 2026-06-08):

1. **"SQLite has no SchemaCreation visitor"** — FALSE. `sqlite3/schema-creation.ts`
   defines `SQLite3SchemaCreation extends AbstractSchemaCreation` with collation,
   generated-column, and FK-deferrable support. The adapter even exposes a
   `schemaCreation` getter (`sqlite3-adapter.ts:126`). What SQLite lacks is the
   `createTableDefinition` adapter override and the `toSql()` override on
   `SQLite3TableDefinition` to route through it.

2. **"SQLite has no dialect TableDefinition override"** — FALSE. `sqlite3/schema-definitions.ts`
   defines `SQLite3TableDefinition extends AbstractTableDefinition` with `references`,
   `belongsTo`, `changeColumn`, `newColumnDefinition`, and `integerLikePrimaryKeyType`
   overrides. It simply has no `toSql()` override.

3. **"PostgreSQL's `toSql()` routes through the visitor"** — INACCURATE. `PgTableDefinition.toSql()`
   calls `super.toSql()` (the hand-rolled generator), then applies `UNLOGGED` via regex
   and exclusion/unique constraints via string splicing. It does NOT call
   `PgSchemaCreation.accept(this)`. The visitor already handles both features via
   `tableModifierInCreate` and `tableConstraintStatements` overrides — so routing through
   the visitor is safe — but the current code takes the hand-rolled path.

4. **"The hand-rolled toSql() is only reached by SQLite"** — INACCURATE. `PgTableDefinition.toSql()`
   calls `super.toSql()`, which IS `AbstractTableDefinition.toSql()`. The hand-rolled path
   is reached by both SQLite and PostgreSQL (via `super.toSql()` in the PG override).

5. **"~15 `_adapterName === "..."` branches"** — Close but slightly off. There are 19
   distinct `_adapterName` checks; 9 are dead for MySQL (MySQL never calls `super.toSql()`),
   leaving ~10 that execute for PG and/or SQLite.

6. **The commit `d593b419a` happened BEFORE this RFC was authored** (same day, 2026-06-08).
   That commit already fixed `MigrationContext.createTable` to use
   `connection.createTableDefinition!` (routing MySQL and PG through their dialect TDs
   and thus their visitors). The "before" picture described in the prompt accurately
   describes the state BEFORE that commit. The RFC's current-state analysis is written
   against the post-commit state.

## Changelog

- 2026-06-08: initial RFC, authored against `main` @ `d593b419a`.
