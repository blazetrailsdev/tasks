---
rfc: "0000-ruby-compat-free-record"
title: "A hand-written sibling of ActiveRecord with no ruby-compat on its import graph"
status: draft
created: 2026-11-24
updated: 2026-11-24
owner: "@deanmarano"
max-est-loc: 1500
packages:
  - "activerecord"
  - "activemodel"
  - "arel"
  - "activesupport"
  - "activerecord-cli"
  - "trails-tsc"
  - "sqlite3"
  - "pg"
  - "mysql2"
  - "scripts"
related-rfcs:
  - "0192-package-entry-point-boot-cost"
  - "0241-request-path-performance"
  - "0194-ruby-compat-native-first"
  - "0197-plain-object-modules-replace-ruby-compat-module"
  - "0221-no-returned-proxies"
  - "0223-package-layout-mirrors-a-rails-gem"
clusters:
  - spike
  - query
  - model
  - associations
  - conformance
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — A ruby-compat-free record package

## Summary

`@blazetrails/activerecord` is a line-for-line port of Rails, and it reaches
Ruby's object model through `@blazetrails/ruby-compat`: `include()` /
`extend()` mixins, `rbFSend`, `rbCallSuper`, `rbEqual` / `rbHash`, `constSet`.
That is what makes the port faithful and easy to keep in step with Rails. It
is also what a consumer pays for on every import and every query. This RFC
proposes a second, hand-written package (working name `@blazetrails/record`)
that offers the common ActiveRecord surface as a drop-in, has no ruby-compat
module anywhere on its import graph, and is measured against raw driver
speed. The faithful port stays as it is, with its parity gates. Column data
still comes from live database reflection at run time, and `trails-tsc` still
supplies the types.

## Motivation

All figures are from `main` at `5e737fa9c2`, non-test `lib/` files.

| Package       | Files | LOC    | Files importing ruby-compat | `@blazetrails/activesupport` imports |
| ------------- | ----- | ------ | --------------------------- | ------------------------------------ |
| activerecord  | 395   | 81,500 | 302                         | 321 (with activemodel and arel)      |
| activemodel   | 75    | 8,888  | 56                          |                                      |
| arel          | 86    | 6,790  | 73                          |                                      |
| activesupport | 245   | 34,346 | 194                         |                                      |
| ruby-compat   | 207   | 58,929 |                             |                                      |

- **Boot.** The app boot in `scripts/boot-graph/baseline.json` loads 343
  activerecord modules, 205 ruby-compat, 193 activesupport, 85 arel and 74
  activemodel: about 900 modules before the first query.
  [RFC 0192](../0192-package-entry-point-boot-cost/README.md) measured one
  binding from the ruby-compat barrel at 139 modules and 147 ms.
- **Request path.** [RFC 0241](../0241-request-path-performance/README.md) found
  trails and Rails at the same CPU per request (1.42 ms) with trails' p95 at
  121 ms against 26 ms, from allocation and major GC. `Base` is assembled by 118 `include()` / `extend()` calls in `base.ts`,
  so every model's prototype is built by copying at load, and the hot path
  runs through `rbEqual` / `rbHash` dispatch, Ruby-truthiness helpers and
  Arel's AST (95 `rbEqual` / `rbHash` calls, 26 `rbObjClone` calls).
- **Raw SQL gap.** `scripts/bench/activerecord-load-records.mts` loads 12,000
  rows of 24 columns. Measured by the spike (trails#10723, Node v26.13.0,
  Linux x64, in-memory SQLite), ActiveRecord costs 5.5 times the bare driver
  to load those rows into records, 45 times for a primary-key `find`, and
  about 150 times for an insert or a one-column update. The full table is
  under "Verification". This RFC makes those ratios the headline numbers.

### What depends on ruby-compat, feature by feature

Counts are occurrences in the feature's files of: string dispatch (`rbFSend`,
`rbStrSend`), `rbCallSuper`, top-level `include` / `extend` / `prepend`,
`rbObjRespondTo` / `isRespondTo`, `new Proxy`, run-time member definition
(`Object.defineProperty`, `rbModDefineMethod`), and `methodMissing` /
`respondToMissing`. "Native difficulty" is how hard the feature is to write
in plain TypeScript with the same observable behaviour.

| Feature                                | LOC    | send | super | mixin | respond | Proxy | define | m_m | Native difficulty | What ties it to ruby-compat                                                                                      |
| -------------------------------------- | ------ | ---- | ----- | ----- | ------- | ----- | ------ | --- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Base` / `Core` composition            | 3,508  | 2    | 2     | 118   | 1       | 1     | 7      | 6   | Easy              | Only the mixin assembly. A flat class hierarchy replaces it.                                                     |
| Relation and query methods             | 10,341 | 12   | 0     | 14    | 16      | 1     | 10     | 6   | Medium            | Per-model relation subclass and delegation of unknown names to the model class; `where` value polymorphism.      |
| Associations, autosave, nested attrs   | 8,799  | 18   | 5     | 9     | 7       | 0     | 23     | 0   | Medium            | Writers and foreign keys dispatched by computed name; 27 `rbEqual` / `rbHash` calls for record identity.         |
| Attribute methods and assignment       | 2,339  | 3    | 1     | 3     | 7       | 0     | 2      | 3   | Medium            | Accessors defined after reflection; `attribute_missing`; assignment by `public_send("name=")`.                   |
| Persistence, counter cache, timestamps | 2,225  | 5    | 7     | 0     | 0       | 0     | 2      | 0   | Easy              | `super` chains through mixed-in modules (`save` through Dirty, Validations, Transactions, Callbacks).            |
| Callbacks and transactions             | 737    | 0    | 4     | 2     | 0       | 0     | 0      | 0   | Easy              | Module `super`; the callback chain itself is activesupport's.                                                    |
| Validations                            | 539    | 0    | 0     | 0     | 1       | 0     | 0      | 0   | Easy              | Nothing here; the dependence is in activemodel's validator lookup by name.                                       |
| Scoping (default and named)            | 444    | 0    | 1     | 0     | 2       | 0     | 3      | 0   | Easy              | Scopes installed as statics; `instance_exec` of the body is a `this` call.                                       |
| Inheritance (STI), delegated type      | 457    | 7    | 4     | 0     | 1       | 0     | 9      | 0   | Medium            | Class lookup by the stored type name (`compute_type`), which needs a registry.                                   |
| Enum                                   | 452    | 0    | 0     | 1     | 1       | 0     | 4      | 0   | Easy              | Predicates, bang writers and scopes are defined at declaration, all names known.                                 |
| Dynamic matchers (`find_by_*`)         | 158    | 1    | 0     | 0     | 0       | 0     | 1      | 3   | **Fundamental**   | A static `method_missing`: a Proxy in the class prototype chain. No native form; `findBy({ … })` already exists. |
| Reflection                             | 1,811  | 0    | 0     | 1     | 0       | 0     | 0      | 0   | Easy              | Plain data.                                                                                                      |
| Model schema, schema cache             | 754    | 0    | 0     | 0     | 3       | 0     | 0      | 0   | Easy              | Nothing. The warm-then-peek shape is already JS-native.                                                          |
| Types                                  | 895    | 0    | 0     | 5     | 2       | 0     | 0      | 0   | Easy              | Value types returned: `BigDecimal`, `TimeWithZone`, `Rational`, Ruby `Range`.                                    |
| Locking                                | 317    | 0    | 2     | 0     | 0       | 0     | 0      | 0   | Easy              | Module `super`.                                                                                                  |
| Serialization, store, coders           | 516    | 0    | 0     | 1     | 1       | 0     | 7      | 0   | Easy              | YAML coder is Psych (ruby-compat). JSON coders are native.                                                       |
| Encryption                             | 2,746  | 3    | 9     | 11    | 2       | 0     | 5      | 0   | Medium            | Thread-local context stack, message serializers; no Ruby object model need.                                      |
| Secure password, token, signed id      | 234    | 0    | 0     | 0     | 0       | 0     | 2      | 0   | Easy              | activesupport's `MessageVerifier`.                                                                               |
| Normalization, readonly attributes     | 205    | 0    | 0     | 2     | 0       | 0     | 0      | 0   | Easy              | Nothing.                                                                                                         |
| Aggregations (`composed_of`)           | 172    | 0    | 3     | 0     | 0       | 0     | 2      | 0   | Medium            | Constructor and converter named by string; rarely used.                                                          |
| Migrations, schema dumper              | 4,498  | 5    | 15    | 14    | 6       | 1     | 0      | 90  | **Fundamental**   | `Migration` and `CommandRecorder` forward every unknown method to the connection; `reversible` replays by name.  |
| Fixtures                               | 1,502  | 1    | 2     | 2     | 1       | 1     | 2      | 8   | **Fundamental**   | Per-table accessor methods by `method_missing`; YAML and ERB loading.                                            |
| Connection handling, configurations    | 1,301  | 0    | 0     | 0     | 0       | 0     | 3      | 0   | Easy              | Nothing.                                                                                                         |
| Connection adapters                    | 25,445 | 14   | 8     | 27    | 8       | 1     | 2      | 0   | Medium            | Ruby value coercion (`rtest` 64, `rbEqual` / `rbHash` 38, `Hash` 36) and the `Monitor` / `Thread` pool model.    |
| Database tasks                         | 1,445  | 7    | 0     | 0     | 0       | 0     | 0      | 0   | Easy              | Task lookup by adapter name.                                                                                     |
| Marshal, YAML, MessagePack records     | 286    | 0    | 0     | 0     | 0       | 0     | 0      | 0   | **Fundamental**   | `Marshal` and Psych are ruby-compat. Only meaningful for Ruby interop.                                           |
| Query logs, explain, log subscriber    | 650    | 0    | 0     | 0     | 2       | 0     | 0      | 0   | Easy              | Nothing.                                                                                                         |
| Statement cache, result                | 815    | 0    | 0     | 0     | 0       | 0     | 1      | 0   | Easy              | Nothing.                                                                                                         |
| Sanitization, integration (cache keys) | 390    | 1    | 0     | 0     | 3       | 0     | 2      | 0   | Easy              | Nothing.                                                                                                         |
| activemodel (whole)                    | 8,888  | 33   | 12    | 61    | 25      | 2     | 22     | 5   | Medium            | Open-set concerns (`Dirty`, `Validations`) bind `super` at include time; attribute-method patterns.              |
| arel (whole)                           | 6,790  | 7    | 0     | 45    | 10      | 0     | 0      | 0   | Easy              | 144 `constSet` / `defineConstants` seats and 95 `rbEqual` / `rbHash` node comparisons. The logic is plain.       |

Read across, the dependence falls into five kinds, and only the last two have
no native answer:

1. **Composition** (`include` / `extend`, `rbCallSuper`, `constSet`): the bulk
   of the count. Mechanical in a hand-written class hierarchy.
2. **Ruby value semantics** (`rtest`, `rbEqual`, `rbHash`, `Hash`, `Range`,
   `BigDecimal`): replaceable by strict JS equality and native values where
   the public type is allowed to change.
3. **Dispatch by computed name** (`rbFSend`): 75 sites in activerecord, 32 in
   activemodel. Nearly all are attribute or association writers, which become
   a lookup in a per-model table built at reflection.
4. **Members that exist only after a database read**: attribute accessors.
   Kept as run-time definition, by decision (see Design).
5. **`method_missing` and Ruby-format serialization**: `find_by_*` matchers,
   `Migration` forwarding, fixture accessors, `respond_to?` probing by
   arbitrary name, `Marshal` and Psych YAML. These are the features that
   depend on ruby-compat fundamentally.

## Design

Decisions marked _(ruled 2026-11-24)_ are the operator's answers given while
this draft was researched.

### One hand-written sibling _(ruled 2026-11-24)_

A new package beside `@blazetrails/activerecord`. It is not a Rails mirror:
the fidelity rules, `parity:api` and the call gates do not apply to it. The
faithful port changes only where a file the sibling shares is freed of
ruby-compat (see "The floor"), and that change must keep its gates green. It is written once, by
hand, as flat TypeScript classes. A build-time transform of the faithful port
and an in-place replacement were both considered and not chosen (see
Alternatives).

It covers what activerecord, activemodel and arel cover together, in one
package, because the three-way split exists to mirror Rails gems and buys
nothing here.

### Relation to other RFCs

- [RFC 0194](../0194-ruby-compat-native-first/README.md) and
  [RFC 0197](../0197-plain-object-modules-replace-ruby-compat-module/README.md),
  both closed, made the faithful port cheaper in place: native forms where
  behaviour is identical, cheaper dispatch, plain-object modules. This RFC
  does not supersede or reopen them, and the faithful port keeps converging
  under their rules. They stop short of what this RFC is after, because a
  Rails mirror must keep `include()`, Arel's AST and the adapter layer. The
  overlap is one-way: the shared files this RFC frees of ruby-compat (see
  "The floor") are freed by RFC 0194's rule, native form where identical.
- [RFC 0221](../0221-no-returned-proxies/README.md) retired the Proxy that
  is returned to a caller and kept the one installed in a prototype chain.
  The faithful port still installs those for `find_by_*` matchers, relation
  delegation, `CommandRecorder` and fixture accessors (the Proxy column of
  the table above). The sibling has neither shape.
- [RFC 0223](../0223-package-layout-mirrors-a-rails-gem/README.md) fixes a
  package's root as `lib/` plus `test/`, with the test tree laid out as the
  upstream gem's. The sibling follows the `lib/` and `test/` roots. It has no
  upstream gem, so its test tree mirrors nothing, and folding three gems'
  worth of surface into one package is outside what RFC 0223 governs.

### Goals _(ruled 2026-11-24)_

1. Boot cost and bundle size.
2. Request-path speed.
3. As close to raw SQL performance as possible.

Each has a number in Verification.

### Drop-in for the common surface _(ruled 2026-11-24)_

A model file compiles and runs against either package by changing its import:

```ts
import { ApplicationRecord } from "./application-record.js";

export class Post extends ApplicationRecord {
  static {
    this.belongsTo("author", { optional: true });
    this.hasMany("comments", { dependent: "destroy" });
    this.validates("title", { presence: true });
    this.scope("published", function () {
      return this.where({ published: true });
    });
    this.enum("status", { draft: 0, published: 1, archived: 2 }, { prefix: true });
  }
}
```

Same names, same signatures, same SQL. The package publishes an explicit list
of what it does not carry:

- `findByTitle`-style dynamic matchers, and any other name answered by
  `method_missing` (relation delegation of unknown names to the class is
  replaced by scopes and declared class methods only);
- `isRespondTo` and `rbFSend`-based access;
- `Marshal`, Psych YAML and `init_with` / `encode_with`;
- `composed_of`;
- singleton-class validations;
- a ruby-compat `Hash`, `Range` or `Rational` in any return position. What a
  `decimal` column returns is Open question 2.

Migrations, the schema dumper, fixtures and database tasks are not
reimplemented. They are development-time and test-time tools that never sit
on a request path, so an app keeps using the faithful port's `ar` CLI for
them (see Non-goals).

### Live reflection stays the source of columns; members are defined at run time _(ruled 2026-11-24)_

No column list is written into a model or generated into one. At boot the
package reads columns from the database (or a dumped schema cache), as
ActiveRecord does, then defines one accessor pair per column on the model's
prototype with `Object.defineProperty`. `trails-tsc` keeps doing what it does
today: it reads `db/schema.ts` and the `static {}` block and supplies the
types in memory, with no emitted code. A model therefore runs under plain
`tsx` with no build step.

To keep that from costing the speed goal:

- accessors are defined once per class, before any instance exists, so every
  instance of a model has one hidden class;
- a record stores its values in a fixed-shape array indexed by column
  position, not in a per-attribute object graph, and casts a value on first
  read;
- association, enum and scope members are defined at declaration time from
  names that are literals in the `static {}` block.

The existing virtualizer (`packages/activerecord-cli/lib/type-virtualization`)
keys on the base class names it is given, so it serves both packages as long
as the sibling's exported type names match for the common surface.

### The floor: activesupport by compat-free subpath, drivers directly _(ruled 2026-11-24)_

- **activesupport** is shared, through subpaths that load no ruby-compat
  module. 51 of its 245 files import nothing from ruby-compat today, among
  them `notifications`. The pieces the sibling needs and that do import it
  (`callbacks` 1 import, `class-attribute` 1, `isolated-execution-state` 2,
  the inflector, `duration` 4, `time-with-zone` 3) are each brought to zero or
  given a compat-free subpath, as stories under this RFC that extend
  RFC 0192's subpath work. Where a piece cannot be freed (see Open question 2)
  the sibling carries its own.
- **Connection adapters are not shared.** The sibling has its own thin layer:
  lease a connection, execute a prepared statement with binds, read rows. It
  borrows three things from the faithful port by subpath, each freed of
  ruby-compat first: quoting, the SQL-type-to-cast-type map, and the
  schema-reflection queries.
- **Drivers.** `@blazetrails/sqlite3`, `pg` and `mysql2` are ports of the Ruby
  gems and import ruby-compat in 18 of 28, 16 of 29 and 7 of 8 files. Each
  wraps an npm engine it takes as a peer dependency: `better-sqlite3`,
  `expo-sqlite` or `libsql`; npm `pg`; npm `mysql2`. Whether the sibling sits
  on the ports or on those engines is Open question 1.

### Queries compile straight to SQL

Arel's logic is plain, but every node is a class instance compared with
`rbEqual` / `rbHash` and cloned with `rbObjClone`, and a relation is turned
into an AST and then visited on every execution. The sibling's relation is an
immutable value holding its clauses. Compiling it yields a SQL string and a
bind list, and the compiled statement is cached by the relation's shape, so a
repeated `Post.where({ id }).first()` costs a cache lookup and one prepared
execute. A small expression builder covers what apps reach Arel for (comparison
and pattern predicates on a column, and SQL function calls); full Arel
interop is Open question 3.

### Correctness: differential tests gate, the Rails suite measures _(ruled 2026-11-24)_

- **Differential tests on every PR.** For a corpus of model definitions and
  calls, the sibling must emit the same SQL and return the same values as
  `@blazetrails/activerecord`, on SQLite, PostgreSQL and MariaDB.
- **The ported Rails suite as the progress metric.** `packages/activerecord/test`
  is run with the sibling substituted for the faithful port. The pass count is
  an only-grow mark. Tests for the unsupported list above are named in a
  published skip file, each with the reason. That suite loads its schema and
  fixtures through the faithful port, which the sibling does not reimplement,
  so the runner keeps the faithful port for setup and substitutes only the
  models under test. Whether that seam is clean is Open question 7.

## Non-goals

- **Replacing or changing `@blazetrails/activerecord`.** It stays the Rails
  mirror, with its gates. Only the shared subpaths are touched.
- **Removing ruby-compat from the rest of trails.** actionpack, actionview and
  trailties keep it.
- **Migrations, schema dumper, fixtures, database tasks.** They depend on
  `method_missing` fundamentally and never run on a request path. An app uses
  the faithful port's CLI for them.
- **Emitting model code from `trails-tsc`.** Ruled out: members are defined at
  run time and `trails-tsc` stays type-only.
- **Ruby-format serialization** (`Marshal`, Psych YAML).
- **Ahead-of-time compilation as a goal.** A flat hierarchy helps a compiler
  such as Perry, but run-time `defineProperty` remains, and no number here
  depends on it.

## Alternatives considered

- **Derive the package with a build transform.** One source, no second
  codebase. Not chosen: the transform would have to resolve 221 `include`
  calls, 70 `rbCallSuper` sites and Ruby value semantics correctly, and the
  result would still carry Arel's AST and the adapter layer, so it would meet
  the boot goal and miss the raw-SQL one.
- **Replace the faithful port in place.** Not chosen: it gives up the Rails
  mirror and every gate that keeps it honest, for three packages that 13
  others in the workspace depend on.
- **Have `trails-tsc` emit accessors at build time.** Removes the last
  run-time definition. Not chosen: it makes a build step mandatory for every
  model, including in the console and in tests.
- **Share the connection adapters.** 25,445 lines, 61 of 84 files on
  ruby-compat, 45 imports of AR's `namespaces.js`. Not chosen: the sibling's
  boot cost and hot path would stay tied to them.
- **Own everything below the model, including an inflector and callbacks.**
  Not chosen: activesupport's pieces are small and nearly free of ruby-compat
  already, and a second inflector would drift from the first.

## Rollout

Only the spike is filed with this RFC. It is two stories: one builds and
measures it, and the other decides whether the RFC goes ahead and files the
rest. The spike lives in `scripts/bench/record-spike/` in trails, not in
`packages/`, so it takes on no publish, CI-lane or parity registration before
the decision is made.

The build story is about 1,500 lines, over the 700-line ceiling, so this
README sets `max-est-loc: 1500`. It is one PR because its parts are only
meaningful together: the ratios need the read path, the write path and the
bare-driver column side by side, and all of it sits in one directory that no
package imports. The phases after the spike go back to the usual ceiling.

1. **Spike.** One model on SQLite, measured against the bare driver. The
   spike imports no trails package at all, activesupport included: its models
   name their table, foreign key and associated class explicitly, so nothing
   is inflected. Sharing activesupport is phase 2 work.
   - `record-spike-on-sqlite-in-one-pr`
   - `record-spike-report-and-decide`
2. **Floor.** Compat-free activesupport subpaths; quoting, type map and
   reflection queries freed in the faithful port; the driver decision
   implemented; the package created under `packages/`.
3. **Query.** Relation, the SQL compiler and its statement cache, calculations,
   `pluck`, batches, `insertAll`, joins, `includes` / `preload` / `eagerLoad`.
4. **Model.** Attributes and types, dirty tracking, validations, callbacks,
   transactions, persistence, locking, timestamps, enums, scopes, STI,
   normalization, secure password and tokens, stores, encryption.
5. **Associations.** `belongsTo` in full, `hasOne`, `hasMany`, through, `hasAndBelongsToMany`,
   polymorphic, autosave, nested attributes, counter caches.
6. **Conformance.** The differential harness, the Rails-suite runner and its
   mark, the `trails-tsc` virtualizer check against the sibling, and one
   example app (`examples/twelve-dollar-server`) switched by import.

Phases 2 to 6 have no stories yet. `record-spike-report-and-decide` files them
if the spike's numbers support going ahead, and closes this RFC if they do
not.

## Verification

- **Zero ruby-compat.** `scripts/boot-graph/measure.mts --entry` on the
  sibling loads 0 ruby-compat modules, held as a CI ceiling of 0. _The spike
  loads 0._
- **Boot.** Importing the sibling and its SQLite adapter loads at most 100
  modules, against 897 for `@blazetrails/activerecord` today. _The spike
  loads 26: 9 of its own, 15 of `better-sqlite3` and 2 of the `tsx` loader.
  The ceiling stays at 100, since the full package will be several times the
  spike._
- **Raw SQL ratio.** Against the bare driver returning the same rows as
  objects: a load into records costs at most 1.5 times, a primary-key `find`
  at most 1.5 times, and an insert or a one-column update at most 3 times.
  _The spike measures 0.8, 0.9, 2.3 and 2.4. The `find` target was 2 and is
  tightened. The write target is new._
- **Request path.** `examples/twelve-dollar-server` on the sibling beats the
  faithful port's p95 and score on RFC 0241's rig.
- **Drop-in.** The README's model example and the `dx-tests` type tests
  compile against the sibling unchanged apart from the import.
- **Conformance.** The differential corpus is green on all three databases,
  and the Rails-suite mark is at least 80% of the tests not on the skip list
  before the package is called usable.

The 80% bar is still a proposal. The other targets are now set from the
spike's measurements below.

### What the spike measured

From trails#10723, before merge. Node v26.13.0, Linux x64, 12,000 rows of 24
columns on in-memory SQLite, median of 5 runs. Microseconds per row. Writes
run inside one transaction on every side. The host is shared and absolute
figures moved by up to 60% between runs, so read the ratios to one
significant figure. `record-spike-report-and-decide` takes them again on
merged code.

| Measure                       | driver | spike | activerecord | spike / driver | activerecord / driver |
| ----------------------------- | -----: | ----: | -----------: | -------------: | --------------------: |
| load                          |   2.90 |  2.44 |        16.03 |            0.8 |                   5.5 |
| load, then read every column  |   3.95 | 12.21 |        83.12 |            3.1 |                  21.0 |
| find by id                    |   5.20 |  4.49 |       231.85 |            0.9 |                  44.6 |
| belongsTo, unloaded           |   4.92 |  5.39 |       348.07 |            1.1 |                  70.8 |
| load with belongsTo preloaded |   3.57 |  2.91 |        17.39 |            0.8 |                   4.9 |
| insert                        |   3.88 |  8.87 |       607.67 |            2.3 |                 156.6 |
| update one column             |   2.31 |  5.57 |       345.93 |            2.4 |                 149.9 |
| heap bytes retained per row   |    738 |   853 |        1,302 |            1.2 |                   1.8 |

| Entry                       | Modules | ruby-compat modules | Median import |
| --------------------------- | ------: | ------------------: | ------------: |
| `record-spike/index.ts`     |      26 |                   0 |         38 ms |
| `@blazetrails/activerecord` |     897 |                 205 |      1,026 ms |

Three things the numbers do not show on their own:

- **A bound `LIMIT` is slow on SQLite.** ActiveRecord sends
  `… WHERE "id" = ? LIMIT ?` for `find`. On `better-sqlite3` that lookup took
  25 µs with the limit bound and 2.6 µs with `LIMIT 1` in the text. The
  spike writes the limit as a literal. That is its one difference in SQL
  from ActiveRecord, and the faithful port pays the cost on every `find`,
  `findBy` and `first`.
- **Temporal is paid only on read.** Building a `Temporal.Instant` costs 0.5
  to 1 µs on this Node. A loaded datetime stays a string until its reader is
  called, and an assigned string already in the database's form is bound as
  it is. Reading eight datetime columns per row is nearly all of the gap
  between "load" and "load, then read every column". This bears on Open
  question 2: any time type built per read costs about this much.
- **The virtualizer recognises spike models unchanged.**
  `packages/activerecord-cli/lib/type-virtualization` finds a class
  extending the spike's `Base`, reads its `tableName` and `belongsTo`, and
  emits the accessor pairs and the `Author | null | Promise<Author | null>`
  reader. What it emits is wrong for the sibling in three places: key
  columns are typed `import("@blazetrails/activerecord").PrimaryKeyValue`,
  datetime columns `TimeWithZone | Time`, and each attribute gets 17
  dirty-tracking members the spike does not define. The conformance phase
  needs the emitted types to be chosen per target package.

## Open questions

1. **Which driver layer?** `@blazetrails/sqlite3`, `pg` and `mysql2` import
   ruby-compat in most files. Options: (a) burn those three packages down to
   zero ruby-compat and sit on them; (b) sit on the npm engines they wrap
   (`better-sqlite3`, `expo-sqlite`, `libsql`, npm `pg`, npm `mysql2`) with a
   small interface of the sibling's own. **Answered by the spike: (b).** On
   `better-sqlite3` directly, a 60-line connection with a prepared-statement
   cache puts `find` and load at the bare driver's cost. Nothing in the
   measurements argues for burning the three driver packages down first. The
   same has still to be shown on npm `pg` and `mysql2`, which are async.
2. **Time and decimal types.** A drop-in returns what ActiveRecord returns.
   For a `decimal` column that is `BigDecimal`. For a time column it is one
   of `TimeWithZone`, a `Temporal.ZonedDateTime` or `Temporal.Instant`, or
   `@blazetrails/date`'s `Time`, depending on the column and on time-zone-aware
   attributes (`packages/activemodel/lib/type/helpers/time-value.ts`).
   `BigDecimal`, `TimeWithZone` and `Time` all import ruby-compat today. The
   spike returns a native `Temporal.Instant` and reads no `decimal` column,
   and records that as a known difference. Options: free all
   three classes of ruby-compat; or return a native value (a string or number
   for decimals, a Temporal value for times) and list it as a difference.
   Recommendation: free all three, because a changed column type breaks the
   drop-in promise for every app with a `decimal` or time column.
3. **Arel interop.** Should the sibling accept `@blazetrails/arel` nodes in
   `where` / `order` / `select`? Accepting them puts arel, and so ruby-compat,
   on the graph of any app that uses them. Recommendation: no; ship the small
   expression builder and, separately, consider freeing arel of ruby-compat,
   which the table above rates easy.
4. **Lazy association readers.** ActiveRecord's `post.author` is
   `Author | null | Promise<Author | null>`. Keeping it is required for
   drop-in; it is also a polymorphic return on a hot path. **Answered by the
   spike: keep it.** A loaded association and a null foreign key answer
   without a promise, and only an unloaded one costs a promise. An unloaded
   read measured 1.1 times a bare `get`, and a load with the association
   preloaded 0.8 times the driver doing the same join by hand.
5. **Framework integration.** actionpack, actionview, activejob, globalid and
   trailties type against `ActiveRecord::Base`. Does a sibling record have to
   work with `formWith`, `redirectTo(post)`, GlobalID and
   `destroy_association_async`? Recommendation: define a structural model
   interface (`toKey`, `toParam`, `modelName`, `errors`, `isPersisted`) the
   sibling satisfies, and leave job-backed features out of the first version.
6. **Name.** `@blazetrails/record` is a placeholder.
7. **Does the faithful port's test suite parameterize cleanly?** **Answered
   by reading, not yet by running: no, not through an import alias.** Of 983
   test files under `packages/activerecord/test`, 808 import the library by
   relative path and 1 by package name, so an alias on the package name
   redirects almost nothing. 604 call `fixtures()`, which needs the
   connection handler, transactional fixtures and the canonical schema
   loader, and 405 import the 200 canonical model files, whose class bodies
   call the whole association and callback surface at import. The seam that
   works today is the one the spike's test uses: one test body handed two
   sets of models. Running the Rails suite against the sibling needs its own
   port of the test support and its own copies of the models, and is sized
   in the conformance phase. `record-spike-report-and-decide` points one
   file at the spike to confirm this.

## Changelog

- 2026-11-24: initial RFC, with the four spike stories
- 2026-11-24: the three build stories became one (`max-est-loc: 1500`); the
  spike's first measurements, taken on trails#10723, are recorded under
  "Verification", with answers to Open questions 1, 4 and 7
