---
rfc: "0017-arel-collector-threading"
title: "Thread the Arel query visitor collector — eliminate ToSql instance state"
status: closed
created: 2026-06-08
updated: 2026-06-20
owner: "@deanmarano"
packages:
  - arel
  - activerecord
clusters:
  - arel-collector-threading
related-rfcs:
  - "0007-remove-global-arel-visitor"
  - "0018-ddl-visitor-convergence"
---

<!-- Unnumbered until merge: keep `rfc:` as 0017-arel-collector-threading and the H1
     below number-free. `scripts/finalize-rfc.mjs` assigns the number at merge.
     Note: 0018-ddl-visitor-convergence is the *schema* SchemaCreation visitor
     (DDL generation); this RFC concerns the *query* ToSql visitor (SELECT/INSERT/
     UPDATE/DELETE SQL rendering). They are distinct visitor hierarchies. -->

# RFC 0017 — Thread the Arel query visitor collector

## Summary

The `ToSql` query visitor in the TS port (`packages/arel/src/visitors/to-sql.ts`)
stores the active collector in `this.collector` instance state and passes the
visitor itself — not the collector — around the call chain. Rails' `ToSql` does
the opposite: every `visit_X(o, collector)` method takes the collector as a second
argument, mutates it, and returns it; the visitor is stateless. This RFC proposes
converting the TS visitor to match Rails' threading pattern: `visit(node, collector)`
returns `collector`; every `visit_*` method takes and returns the collector.
The conversion also eliminates the `_extractBinds` boolean mode flag, which exists
solely because instance state cannot distinguish collector types at call time —
threading makes the flag unnecessary.

The change touches zero public API. It is safe today (the path is fully
synchronous). Its value is **Rails structural fidelity and future-proofing**, not
a present-day bug fix.

## Motivation

### Governing principle: Rails structural fidelity

The rails-port methodology is stated plainly in the project's three canonical
documents:

- **`README.md:5`** — _"The goal is **100% API compatible with Rails**, with
  behavior matched **test for test** against the Rails source."_
- **`README.md:211`** — _"**Rails API fidelity** — Names and call signatures
  match Rails. When the Rails docs show `User.where(name: "dean").order(:created_at)`,
  the TypeScript equivalent should feel the same."_
- **`CONTRIBUTING.md:13`** — _"Read the Rails source first to understand the
  expected behavior."_

The point of `api:compare` and `test:compare` is to make divergences visible.
The `ToSql` collector threading is a deliberate structural divergence. The port
chose instance-state threading for convenience at the time, but it diverges from
Rails' design in a way that (a) adds complexity Rails doesn't have (`_extractBinds`,
`compileWithCollector` save/restore) and (b) creates a latent safety risk that
Rails specifically threaded to avoid.

### The Rails design (source of truth)

`Arel::Visitors::Visitor#visit`
(`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:27`):

```ruby
def visit(object, collector = nil)
  dispatch_method = dispatch[object.class]
  if collector
    send dispatch_method, object, collector
  else
    send dispatch_method, object
  end
end
```

`Arel::Visitors::ToSql#compile`
(`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:17`):

```ruby
def compile(node, collector = Arel::Collectors::SQLString.new)
  accept(node, collector).value
end
```

Every `visit_X` receives the collector as a second arg, appends to it, and returns it:

```ruby
def visit_Arel_Nodes_DeleteStatement(o, collector)
  collector.retryable = false
  # ...
  collector = visit o.relation, collector
  collect_nodes_for o.wheres, collector, " WHERE ", " AND "
  maybe_visit o.limit, collector
end
```

The collector lives on the call stack. The adapter's cached `@visitor` is genuinely
stateless between calls.

Rails collectors (`SQLString`, `Bind`, `Composite`, `SubstituteBinds`) all implement
`<<`, `add_bind`, and `add_binds` and return `self`. The distinction between
"inline-quote" and "extract bind" is determined entirely by **which collector is
passed** to `compile` — no boolean flag exists in Rails. Passing `SQLString` inserts
placeholders; passing `Bind` collects values; passing `Composite` does both
simultaneously.

The Rails subclasses (`mysql.rb`: 12 `visit_*` methods, `postgresql.rb`: 12,
`sqlite.rb`: 6) all follow the same two-arg pattern.

### The TS divergence

**`packages/arel/src/visitors/to-sql.ts:55–68`:**

```ts
protected collector!: SQLString;
protected _extractBinds = false;

compile(node: Node): string {
  this.collector = new SQLString();
  this.visit(node);
  return this.collector.value;
}
```

Every `visit_*` reads/writes `this.collector` and takes only the node. The
`visit` override at line 1617 explicitly drops the collector the base `Visitor`
would pass:

```ts
// "Rails passes the collector as a second arg through the visit chain;
//  we route SQL through `this.collector` instance state instead, so the
//  base's collector argument is unused here by design."
visit(node: Node): SQLString {
  return super.visit(node) as SQLString;
}
```

**`compileWithBinds` (lines 1596–1608)** must save/restore `_extractBinds` via
`try/finally` and swap `this.collector` to a `Composite` collector and back:

```ts
compileWithBinds(node: Node): [string, unknown[]] {
  const sqlCollector = new SQLString();
  const bindCollector = new Bind();
  this.collector = new Composite(sqlCollector, bindCollector) as unknown as SQLString;
  this._extractBinds = true;
  try {
    this.visit(node);
  } finally {
    this._extractBinds = false;  // must restore even if visit throws
  }
  // ...
}
```

The `try/finally` exists _because_ the collector is instance state. Threaded
collectors make the save/restore unnecessary: pass the `Composite` as an
argument and let it fall off the stack.

Individual `visit_*` methods (e.g. `visitArelNodesCasted`, `visitArelNodesBindParam`)
branch on `this._extractBinds` to decide whether to call `collector.addBind()`
or `this.quote()`. Rails never does this — it calls `collector.add_bind()` always
and lets the collector type handle the routing.

### Why it's safe today — and why that won't last

**The safety invariant:** the entire visit path is **synchronous**. Verified:

```text
grep -rn "async\|await" packages/arel/src/visitors/to-sql.ts  → 0 results
grep -rn "async\|await" packages/arel/src/visitors/mysql.ts   → 0 results
grep -rn "async\|await" packages/arel/src/visitors/postgresql.ts → 0 results
grep -rn "async\|await" packages/arel/src/visitors/sqlite.ts  → 0 results
```

JS's single-threaded event loop means a synchronous `compile()` runs to
completion without yielding, so the cached `this._visitor` (set once in
`AbstractAdapter`'s constructor, `abstract-adapter.ts:470`) can't interleave
across queries. The hazard Rails threaded to prevent is neutralized today.

**The latent risk:** the invariant is _"the visit path stays synchronous and
never re-enters `compile()` on the same visitor instance."_ The moment any
`visit_*` method needs to `await` (async type resolution, lazy schema loading)
or a nested `compile()` fires on the same instance, `this.collector` and
`this._extractBinds` are clobbered. Instance-state threading is safe
**only** under a constraint that must be upheld forever. Stack-threading removes
the constraint.

This is not presented as an active bug. It is structural debt that grows
riskier as the codebase evolves.

### What this RFC is NOT

This RFC is **not** motivated by `api:compare` arity metrics. Approximately 123
advisory arity mismatches appear in `api:compare` output (every `visit_X(o, collector)`
vs `(node)` pair), and this work would clear them as a side-effect. However,
PR #3045 classified these as known-divergence noise in the arity heuristic. We
are not refactoring a hot, well-tested path to satisfy an advisory metric. The
motivation is Rails structural fidelity and elimination of the save/restore
state-juggling that instance state imposes.

## Design

### Visitor base

`Visitor.visit(object, collector?)` in `visitor.ts` already conditionally passes
the collector when one is provided (line 67):

```ts
return (fn as (n: Node, c?: unknown) => unknown).call(this, object, collector);
```

The base already threads it. The only change needed in `visitor.ts`: strengthen
the return type from `unknown` to the collector type (a type-level change,
behavior-neutral).

### Signature migration

Rails' shape, mirrored in TS:

```ts
// Before
protected visitArelNodesDeleteStatement(o: Nodes.DeleteStatement): SQLString

// After
protected visitArelNodesDeleteStatement(o: Nodes.DeleteStatement, collector: SQLString): SQLString
```

`compile()` becomes:

```ts
compile(node: Node): string {
  return this.visit(node, new SQLString()).value;
}
```

`compileWithBinds()` becomes:

```ts
compileWithBinds(node: Node): [string, unknown[]] {
  const sqlCollector = new SQLString();
  const bindCollector = new Bind();
  const composite = new Composite(sqlCollector, bindCollector);
  this.visit(node, composite as unknown as SQLString);
  const binds = bindCollector.value.map((b) =>
    b instanceof Nodes.BindParam ? b.value : b
  );
  return [sqlCollector.value, binds];
}
```

No `try/finally`. No `_extractBinds` flag. The collector type routes the
behavior, exactly as in Rails.

### Eliminating `_extractBinds`

In Rails, `visit_Arel_Nodes_BindParam(o, collector)` calls
`collector.add_bind(o.value, &bind_block)` unconditionally. `SQLString#add_bind`
inserts a `"?"` placeholder; `Bind#add_bind` appends the value to its array;
`Composite#add_bind` delegates to both. No boolean flag needed.

After threading, the TS `visitArelNodesBindParam` and `visitArelNodesCasted`
call `collector.addBind(value, this.bindBlock())` unconditionally and let the
collector handle routing. The `_extractBinds` field is deleted. The branches
`if (this._extractBinds) { ... } else { ... }` collapse to one line.

### `PostgreSQLWithBinds.bindIndex`

Currently `this.bindIndex` is an instance field reset at each `compile*` entry
and incremented in two `visitArel*` methods. After threading, the bind index
must travel with the call. Options:

- A `PostgreSQLSQLString` collector subclass that extends `SQLString` and tracks
  `bindIndex`, overriding `addBind` to emit `$N` instead of `?`. This is the
  cleanest: the index travels with the collector as in Rails' adapter-specific
  `add_bind` override.
- A closure captured at `compile()` time and threaded separately.

The Phase 3 story chooses the approach; the collector subclass is the Rails-closest
pattern and is recommended.

### Blast radius

**`to-sql.ts`** — 57 `protected visitArel*` methods to add the `collector` param.
Plus `compile`, `compileWithCollector`, `compileWithBinds` simplifications;
deletion of `this.collector`, `_extractBinds`, and the `visit` override. ~300 LOC
modified.

**`mysql.ts`** — 12 `protected override visitArel*` methods.

**`postgresql.ts`** — 13 methods total: 11 in `PostgreSQL` + 2 in
`PostgreSQLWithBinds`. Plus `bindIndex` refactor.

**`sqlite.ts`** — 6 `protected override visitArel*` methods.

**`dot.ts`** — 36 `protected visitArel*` methods, but `Dot extends Visitor` directly
(not `ToSql`) and maintains its own `nodes`/`edges` graph state — no `this.collector`.
**`Dot` is excluded from this migration.** Its `accept()` already receives and
returns a collector; it is already threaded at the public boundary.

**Total `visit_*` methods to convert in the `ToSql` hierarchy: 88** (57 + 12 +
13 + 6).

**Public API impact: zero.** All `visit_*` methods are `protected @internal`.
External callers use only `compile()`, `compileWithBinds()`, and
`compileWithCollector()` — unchanged signatures. Verified: `grep -rn "visitArel"`
in packages outside `arel/src/visitors/` returns only two comments in
`encryption/extended-deterministic-queries.ts`. No external callers of the
protected methods.

### Relationship to related RFCs

**RFC 0007 (remove-global-arel-visitor)** routes production callers through
`connection.toSql(node)` instead of the global `Node#toSql()` registry. That
RFC operates at the _call-site_ level; this RFC operates at the visitor's
_internal visit-chain_ level. Orthogonal and order-independent: RFC 0007's
`connection.toSql()` calls `visitor.compile(node)`, which after this RFC calls
`this.visit(node, new SQLString())`. Either can land first.

**RFC 0018-ddl-visitor-convergence** concerns `SchemaCreation` — the DDL visitor
hierarchy that generates `CREATE TABLE` SQL. This RFC concerns `ToSql` — the
query visitor hierarchy that generates `SELECT`/`INSERT`/`UPDATE`/`DELETE` SQL.
They are entirely separate class hierarchies. Do not conflate them.

## Alternatives considered

- **Status quo + comment (Option A).** A comment at line 1611 already documents
  the divergence. Cost: zero. Downside: the save/restore machinery stays,
  `_extractBinds` stays, and structural divergence from Rails compounds
  indefinitely. Low cost now, compounding cost later.

- **Full Rails-style threading (Option B — recommended).** Matches Rails
  structurally. Eliminates `_extractBinds`, the save/restore hacks, and the
  `this.collector` instance field. Makes the visitor genuinely reentrant. The
  conversion is mechanical (add `collector` param, thread it, delete `_extractBinds`
  branches). The test surface (`compile()` output) is rich, providing high
  confidence the behavior is unchanged.

- **Typed reentrancy guard (Option C).** Keep instance state but add a
  `#compiling = false` guard that throws on re-entry. Addresses the symptom
  (reentrancy) without fixing the cause (instance state). Doesn't survive
  `await`. Adds complexity for zero fidelity gain.

**Recommendation: Option B.** Mechanical conversion, rich test coverage,
exact structural alignment with Rails.

## Rollout

Each phase is a separate PR from `main`, non-overlapping files, ≤500 LOC.
CI runs `test:compare` and the arel suites on every push. Locally run only
the touched arel test files.

1. **Phase 1 — `Visitor` base type strengthening:**
   strengthen `visit()` return type in `visitor.ts` and define a `Collector`
   interface if needed. Backward-compatible type change only.
   → Story: [`p1-visitor-base-types`](stories/p1-visitor-base-types.md)

2. **Phase 2 — Thread collector through `to-sql.ts`:**
   add `collector` param to all 57 `visitArel*` methods; update `compile`,
   `compileWithBinds`, `compileWithCollector`; delete `this.collector`,
   `_extractBinds`, and the `visit` override.
   → Story: [`p2-to-sql-threading`](stories/p2-to-sql-threading.md)

3. **Phase 3 — Thread collector through subclasses:**
   add `collector` param to all 31 override methods in `mysql.ts`,
   `postgresql.ts`, `sqlite.ts`; implement `PostgreSQLSQLString` collector if
   chosen; simplify `PostgreSQLWithBinds`.
   → Story: [`p3-subclass-threading`](stories/p3-subclass-threading.md)

4. **Phase 4 — Verification:**
   confirm `test:compare` green, arel test suites green; note `api:compare`
   arity delta (123 advisory mismatches cleared as side-effect). No behavior
   change expected.
   → Story: [`p4-verification`](stories/p4-verification.md)

## Open questions

1. **`PostgreSQLWithBinds.bindIndex` approach.** A `PostgreSQLSQLString`
   collector subclass is recommended (index travels with the collector, matching
   Rails' pattern). Validate in Phase 3 that no other consumer relies on the
   `bindIndex` instance field directly.

2. **`compileWithCollector` callers — resolved.** `database-statements.ts:284`
   calls `visitor.compileWithCollector(node, collector)` where `collector` is a
   real external collector (`SubstituteBinds` or `PartialQueryCollector` from
   `adapter.collector()`). After threading this call becomes
   `this.visit(node, collector)` — the collector's own `addBind` handles
   routing unconditionally, which is exactly what `_extractBinds = true` was
   doing before. No behavior change. Phase 2 should remove the `if
(externalCollector)` guard (it was only needed to set `_extractBinds`) and
   keep the method as a one-liner delegating to `this.visit`.

## Changelog

- 2026-06-08: initial RFC
