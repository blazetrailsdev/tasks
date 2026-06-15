---
title: "Audit: bind-inlining vs Rails — pin exact mechanism for compile/to_sql/where-clause"
status: done
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: verify
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: 3310
claim: "2026-06-15T00:00:39Z"
assignee: "audit-bind-inlining-rails-fidelity"
blocked-by: null
---

## Context

PR #3300 converted four bind-inlining sites from a post-hoc
`sql.replace(/\?|\$\d+/g, …)` regex to a `SubstituteBinds` collector:
`ToSql#compile` (no-collector), `Relation#toSql`, `Relation#_compileArelNode`,
`WhereClause#toSql`. It deliberately **preserved behavior** (no snapshot/
api/test delta), so several trails-isms remain and a fifth regex site was left
untouched:

- `connection.toSql` / `compileInlined`
  (`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:164`)
  still inlines via `sql.replace(/\?|\$\d+/g, …)`.
- `Collectors.InlineBinds` (`packages/arel/src/collectors/inline-binds.ts`) — a
  trails-only hybrid collector that inlines `Casted`/`Quoted` literals but keeps
  `BindParam` as `?`. Rails/Arel has only `SQLString` (all `?`) and
  `SubstituteBinds` (all inlined). `InlineBinds` exists because trails routes
  `visit_Arel_Nodes_Casted` through `collector.addBind` (`to-sql.ts:220`),
  whereas Arel's `visit_Casted` appends the quoted literal **directly**
  (`collector << quoted(...)`) and only `BindParam` uses `add_bind`.
- Bespoke quoters: `inspectQuoter` (where-clause) and `_inlineBindQuoter`
  (relation) instead of passing the connection as Arel does.
- `Relation#_lastSelectNode` bookkeeping to recompile, vs Rails re-deriving
  `arel` under `unprepared_statement`.

## Goal (this story — audit only, no production code)

Read the **actual targeted Rails/Arel source** (activerecord
`relation.rb`/`relation/query_methods.rb`/`relation/where_clause.rb` +
`database_statements.rb`, and the vendored `arel` `visitors/to_sql.rb` +
`collectors/*`) and pin the exact, version-correct mechanism for each node and
each path. Produce a verified conversion plan the implementation stories depend
on.

Specifically resolve:

1. Does Arel's `visit_Arel_Nodes_Casted` use `add_bind` or `<<` (direct quote)
   in the targeted version? (Determines whether bare `compile`/`Node#toSql`
   should render `Casted` as `?` or inline it — i.e. whether `InlineBinds` is a
   genuine divergence to delete or a faithful behavior to relocate into the
   visitor.)
2. What collector does Rails' bare `compile`/`Node#to_sql` default to, and what
   does Arel's own `to_sql_test.rb` assert for `compile(table[:x].eq(5))`?
3. Does Rails have a `WhereClause#to_sql` at all? If not, where do trails' ~N
   callers' equivalents live in Rails?
4. How does Rails' `Relation#to_sql` produce inlined SQL
   (`unprepared_statement { conn.to_sql(arel) }`) and what is `conn.to_sql`'s
   collector path?
5. Does Rails inline `_compileArelNode`-style embedded SQL (JOIN ON / order
   fragments), or thread those binds through the outer collector? (Overlap with
   RFC 0017 arel-collector-threading.)

## Acceptance criteria

- An audit report (delivered via the `audit-report` skill / PR description, not
  new production code) that, for each of the 5+ inline sites, states the exact
  Rails mechanism with file:line citations and classifies the trails delta as:
  faithful / divergent-remove / divergent-relocate / needs-threading.
- A corrected dependency ordering for the follow-up stories
  (connection-tosql-via-collector, relation-tosql-unprepared-statement,
  whereclause-tosql-drop-inspectquoter, compile-casted-inline-in-visitor,
  compile-arel-node-bind-threading), revising their scope where the source
  contradicts the assumptions in their bodies.
- No behavior change; spike/audit stories are done-when-PR-closed.

## Findings (verified against Rails v8.0.2 @ vendor/rails)

Source: `vendor/rails/activerecord/lib/arel/visitors/to_sql.rb`,
`.../arel/collectors/*.rb`, `.../active_record/relation.rb`,
`.../connection_adapters/abstract/database_statements.rb`,
`.../relation/where_clause.rb`.

1. **`compile` defaults to `SQLString`** (`to_sql.rb:17`):
   `def compile(node, collector = Arel::Collectors::SQLString.new)`.

2. **`Casted` and `Quoted` inline directly; only `BindParam` defers**
   (`to_sql.rb:87-90, 760-762`):

   ```ruby
   def visit_Arel_Nodes_Casted(o, collector)
     collector << quote(o.value_for_database).to_s   # INLINE via <<
   end
   alias :visit_Arel_Nodes_Quoted :visit_Arel_Nodes_Casted
   def visit_Arel_Nodes_BindParam(o, collector)
     collector.add_bind(o.value, &bind_block)        # add_bind → "?"
   end
   ```

   So with the default `SQLString`: `compile(Casted(5))` → `5`,
   `compile(BindParam(5))` → `?`. **This is exactly trails' `InlineBinds`
   output — but Rails gets it from a plain `SQLString` + visitor-level
   inlining, with NO special collector.** trails' `visit_Arel_Nodes_Casted`
   (`to-sql.ts:220`) instead routes through `collector.addBind`, and its
   inline-comment claiming `add_bind` parity is **factually wrong for v8.0.2**.
   `visit_Quoted` (`to-sql.ts:1852`) already inlines correctly.

3. **`HomogeneousIn` uses `add_binds`** (`to_sql.rb:336-355`), so its
   `casted_values` parameterize (SQLString→`?`, SubstituteBinds→inline).
   trails `to-sql.ts:710` already mirrors this — leave it.

4. **`Casted` is execution-safe to inline**: `where(id: 5)` builds an
   `attr.eq(QueryAttribute)` bind (predicate_builder), NOT a `Casted`. `Casted`
   only appears for genuine inline literals (raw Arel `table[:x].eq(5)`), which
   Rails inlines into executable SQL with no bind. Watch for exec-path snapshots
   where a raw-Arel `Casted` previously emitted `?`+bind.

5. **`Relation#to_sql`** (`relation.rb:1217-1219`):
   `conn.unprepared_statement { conn.to_sql(arel) }` — no cached node, no bespoke
   quoter.

6. **`connection.to_sql`** (`database_statements.rb:12-50`) compiles through
   `collector()` (`abstract_adapter.rb:1176` — `SubstituteBinds` when
   `!prepared_statements`); no regex anywhere. trails' `compileInlined`
   `sql.replace(/\?|\$\d+/)` (database_statements.ts:164) is a pure TS-ism.

7. **`WhereClause#to_sql` does NOT exist in Rails** (`relation/where_clause.rb`).
   The whole trails method + `inspectQuoter` is a trails-ism → remove and migrate
   callers (story whereclause-tosql-drop-inspectquoter).

### Verdict on PR #3300

`InlineBinds` is the wrong-layer fix: the Rails-faithful change is to inline
`Casted` in the visitor (mirroring `visit_Quoted`), after which a plain
`SQLString` reproduces Rails and `InlineBinds` is deleted. Recommend NOT merging
PR #3300; fold its intent into compile-casted-inline-in-visitor + the
connection/relation/where-clause stories. Dependency order unchanged.
