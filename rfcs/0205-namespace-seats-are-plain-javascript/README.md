---
rfc: "0205-namespace-seats-are-plain-javascript"
title: "Lean on ES imports: namespace seating survives only where module evaluation order needs it"
status: active
created: 2026-10-22
updated: 2026-10-27
owner: "@deanmarano"
packages:
  - "ruby-compat"
  - "arel"
  - "activerecord"
  - "actionpack"
  - "actionview"
  - "activejob"
  - "actioncable"
  - "activemodel"
  - "activesupport"
  - "msgpack"
  - "trailties"
  - "nokogiri"
  - "rack"
  - "bcrypt"
  - "marcel"
  - "globalid"
  - "scripts"
  - "rack-session"
  - "date"
  - "solid-queue"
clusters:
  - design
  - retire
  - conversion
  - tooling
related-rfcs:
  - "0151-activesupport-autoload-slot-registry"
  - "0154-ruby-compat-surfaced-deviations"
  - "0197-plain-object-modules-replace-ruby-compat-module"
priority: 1
---

# RFC 0205 — Lean on ES imports

## Summary

A class reaches another class through a namespace object — `new Nodes.Not(this)`,
`ActiveRecord.Base`, `Tags.PasswordField` — seated there by
`rbModConstSet(Owner, "Name", Klass)` at 790 call sites in 407 files. The
mechanism exists to give trails Ruby's call-time constant resolution, because
an eager ESM `import` would close a load-order cycle.

**ESM already provides call-time resolution inside a function body.** An
`import` binding is live and is read when the expression runs, not when the
module is evaluated, so `import { Not } from "./unary.js"` used inside a method
is resolved at call time — exactly what Ruby's autoload bought Rails — and is
safe even when the two modules are in a cycle. The TDZ failure the namespace
objects were built to avoid happens only for a read evaluated _while the module
body runs_: an `extends` clause, a top-level call, a top-level `new`.

Measured across all 15 packages:

| namespace reads                                                        | count   |
| ---------------------------------------------------------------------- | ------- |
| deferred — inside a function or method body, safe as a plain ES import | **631** |
| module-eval — `extends` clause or top-level statement                  | **55**  |

And of those 55, 8 are TypeScript type positions (`T extends
Nodes.UpdateStatement`) that are erased before runtime, ~35 are
`extends Migration.Current` in test-helper migration fixtures, where the
superclass really is chosen at load time, and the genuine framework cases
number **fewer than ten** — named individually in "What survives" below.

So the default becomes the plain ES import, the namespace objects shrink to the
handful of sites where module evaluation order actually needs them, and
`rbModConstSet` is left only where the Rails body itself calls `const_set`
(18 sites in the vendored Rails tree).

## Why the current shape is wrong

**It solves a problem ESM does not have.** The ratified rule in CLAUDE.md
§ "Call-time constant resolution" opens "ESM has no equivalent. Every `import`
is eager and evaluated before the importing module's body, so naming a constant
in a method body still costs a module-eval edge." The first half is true and
the second does not follow: the _edge_ is eager, the _read_ is not. A cycle is
only fatal when a module needs a binding from the cycle while its own body is
still running. 631 of 686 reads do not.

**It is an invented call at 772 sites, and no gate can see it.** CLAUDE.md
§ "Before you open the PR" says outright that an added call is invisible to
both call gates — they flag what Rails does and the port omits, never the
reverse. That is how this went from 15 sites to 790 in four weeks with every
ratchet green.

**It discards what the import graph tells the reader and the compiler.** A
plain `import { Not } from "./unary.js"` says where `Not` comes from, is
checked, is renamed by a refactor, and is dropped by an unused-import lint. A
`Nodes.Not` read says only that something, somewhere, seated it. The seat call
itself takes `(mod: … | { readonly name: string }, id: string, value: T)` with
nothing relating `value` to `mod[id]`, so a seat onto the wrong owner, or under
a name the namespace does not declare, type-checks. 790 assignments gave up a
compile-time guarantee TypeScript was giving for free.

**It reads as framework ceremony.** A Rails developer opening
`arel/nodes/binary.rb` sees `class Join < Binary; end` and no registration
line. Our counterpart carries an import of `rbModConstSet` and a trailing call,
times 407 files.

## The design

### A read inside a body is a plain ES import

```ts
// packages/arel/src/nodes/node.ts — before
import { Nodes } from "../namespaces.js";
not() { return new Nodes.Not(this); }

// after
import { Not } from "./unary.js";
not() { return new Not(this); }
```

`unary.ts` imports `node.ts` for `class Unary extends Node`, so this is inside
arel's real 65-module cycle — and it is still correct, because `not()` runs
long after both modules are evaluated. This is the shape for 631 reads.

### Module-eval reads keep call-time resolution

Where the read runs during module evaluation, the namespace stays, because the
problem is real:

```ts
// packages/activerecord/src/base.ts
include(Base, ActiveRecord.Scoping);
```

A direct import here would evaluate `scoping.ts` before `Base` exists. These
sites keep the namespace read and are enumerated, not discovered — a new one
needs a named reason, which is what the gate in story 12 enforces.

### `rbModConstSet` survives only where Rails says `const_set`

The helper is a faithful port of `Module#const_set`
(`vendor/ruby/v3.3.11/variable.c:3648-3668`) and stays for the Rails sites that
call it, all with a computed name and no declaration to assign at:
`GeneratedAttributeMethods` (`attribute_methods.rb:43`),
`GeneratedAssociationMethods` (`core.rb:340`), the mangled delegate and
`GeneratedRelationMethods` (`relation/delegation.rb:40,65`), the HABTM join
model (`associations.rb:1877`), an association extension module
(`associations/builder/collection_association.rb:26`), the generated arel node
classes (`arel/nodes/{binary,unary,function}.rb`), an `ATTR_` name constant
(`activemodel/attribute_methods.rb:584`), `HelperMethods`
(`abstract_controller/helpers.rb:232`), `Types` (`action_view/template.rb:189`),
`ClassMethods` (`concern.rb:212`), a `concerning` topic
(`concerning.rb:133`), a stubbed constant (`constant_stubbing.rb:33-45`), and
`Object::APP_PATH` (`app_loader.rb:57`). Eighteen sites.

The rule is per body, not per count. A ported gem that calls `const_set`
qualifies identically: thor's `rake_compat.rb:64`
(`klass.const_set(const_name, Class.new(Thor))`) is the only such site outside
Rails in the vendored sources trails ports, and is itself unported. racc's
three (`statetransitiontable.rb:271,285,286`) are in a gem with no trails
package. `vendor/ruby`'s are MRI internals, not a ported body.

A surviving module-eval _seat_ is a plain assignment, `Owner.Name = Klass`,
which is type-checked where the helper call was not.

### The Ruby path is generated from the parity manifest, not registered

The seat's other effect is a write into the `classpaths` WeakMap so `rbModName`
answers `"Arel::Nodes::Not"` rather than JavaScript's `"Not"`. That path is
real Rails behaviour — it surfaces in `inspect`, error messages, STI type
columns and i18n keys — so it is kept. It does not need 790 runtime calls to
record it: `scripts/api-compare/output/rails-api.json` already holds every Ruby
class's `fqn` and defining file (`"Arel::Nodes::NotEqual": { fqn:
"Arel::Nodes::NotEqual", file: "nodes/binary.rb", … }`), and `parity:api`
already matches each TS class to that Ruby counterpart.

So each package gets one **generated** module mapping its exported classes to
their Ruby fqn, built by the existing manifest tooling and checked in, which
`rbModName` consults before falling back to `klass.name`. Three properties the
current shape lacks: it is verified by `parity:api` rather than by hand, a
wrong or missing path is a CI red rather than a silently unqualified name, and
adding a class costs nothing at its declaration.

### Lookup goes too, not only definition

An earlier draft left `rbModConstGet` / `rbModConstDefined` / `rbModConstants`
/ `registerConstant` untouched as "nine" dynamic lookups. Measured on
2026-10-27 they are far more: 587 `registerConstant` calls (139 non-test
files), 38 `rbModConstGet`, 11 `rbModConstDefined`, 6 `rbModConstants`, and
58 more calls into the top-level constant table, plus the invented
`registerModel` / `registerController` / `registerJob` / `registerChannel` /
`registerConnection` APIs (385 test call sites for `registerModel` alone).
By repo-owner ruling (2026-10-27) the goal is for constant **lookup** to go
away entirely, not only seating:

- A string-keyed lookup with a literal name is a plain ES import, as
  CLAUDE.md § "A dispatch by name is spelled directly" rules for `send`.
- A computed-name lookup survives only where the Rails body calls
  `const_get`, `const_defined?`, `constants`, `constantize` or `path2class`,
  and it reads the owner's own properties or a generated class-path table.
- `registerConstant` and the top-level constant table `RCLASS_CONST_TBL` are
  deleted. Framework and core classes resolve through generated class-path
  tables. Application classes resolve through a per-application class-path
  table that trailties' eager boot scan fills, read the same way as the
  generated tables. This supersedes the `registerX` ruling of 2026-10-26
  (trails#9319); the reasoning is in
  `application-classes-resolve-without-a-registration-call`.
- Each module-eval survivor below gets its own plan to become an import.

## What survives

The complete module-eval population, to be confirmed per package by its sweep
and then frozen by the gate:

- `activerecord/src/base.ts` — `include(Base, ActiveRecord.Scoping)` and
  `include(Base, ActiveRecord.Associations)`. The genuine `Base` cycle.
- `actionpack/src/action-controller/test-case.ts` —
  `include(Metal, Testing.Functional)`.
- `actionpack/src/action-dispatch/testing/assertions/routing.ts` —
  `class extends ActionDispatch.Integration.Session`.
- `actionpack/src/action-dispatch/http/{mime-negotiation,parameters}.ts` and
  `activesupport/src/message-pack/extensions.ts` — seats onto a _nested_
  namespace read at module-eval time.
- `activerecord/src/test-helpers/migrations/**` and
  `test-helpers/anonymous-migration.ts` — ~35 `extends Migration.Current`.
  A migration's superclass is genuinely chosen at load time and the files are
  loaded by `rbFLoad` (CLAUDE.md § "A migration file is loaded by
  `Kernel#load`"), so these stay; the sweep story confirms rather than converts
  them.
- arel's 8 `T extends Nodes.X` type positions convert to `import type`, which
  is erased and costs no edge.

Anything not on this list, after its sweep, is a plain ES import.

## Scope

Story 1 amends the four CLAUDE.md texts. Story 2 lands the generated path
table. Stories 3–11 are the per-package conversions. Story 12 gates both
`rbModConstSet` and module-eval namespace reads. Story 13 retires the backlog
arm still scheduled to do the opposite.

The lookup arm, added 2026-10-27:

- `constant-lookup-helpers-keep-only-rails-const-get-sites`
- `framework-register-constant-seats-retire-onto-class-path-tables`
- `ruby-compat-core-classes-join-a-generated-class-path-table`
- `application-classes-resolve-without-a-registration-call`
- `test-suites-drop-register-model-and-register-constant`
- `module-eval-namespace-reads-converge-to-imports`
- `delete-register-constant-and-the-top-level-constant-table`, the finish
  line, which depends on all of the above and the gate

Each conversion must re-run the ESM entry-module check CLAUDE.md
§ "Call-time constant resolution" prescribes — a plain-node import of the
**built** `dist/**.js` modules as entry modules, because a vitest run enters a
funnel module first and masks a TDZ. That check is the acceptance test for
"this read was deferred after all", and it is why the conversions are per
package rather than one sweep.

## Out of scope

- **`ActiveSupport::Autoload` and the namespace objects' own existence.** The
  objects stay — they remain the public `Arel.Nodes` / `ActiveRecord.Base`
  surface a Rails developer reaches for, and RFC 0151 settled the autoload
  layer. This RFC changes how _framework-internal_ code reaches a class.
- **Dropping the qualified Ruby path.** It is Rails-visible behaviour;
  generating it is the point.
- **Application autoloading**, ratified absent in CLAUDE.md § "Trails has no
  autoloader".

## Alternatives considered

**Seat with a plain assignment and keep every read going through the
namespace.** This was this RFC's first draft, and it is only a relabeling: the
790 calls become 790 assignments, the import graph still says nothing, and the
reader still cannot tell where a class comes from. Rejected by the repo owner
on 2026-10-22: "I only want the namespace seating when necessary, I want to
lean on ES imports / exports."

**Convert the reads but keep the runtime `classpaths` registration.** Rejected:
once a class is not seated on a namespace there is nothing to register it from,
and the parity manifest already holds the answer with CI verification behind
it.

**Leave the deferred reads alone because they work.** Rejected: they are 631
invented calls past a mechanism that costs a compile-time check and a readable
import graph, and the rule that produced them is still in CLAUDE.md producing
more.

## What this RFC reverses

Four live texts tell an agent to spell a seat with the helper, all amended by
story 1: root `CLAUDE.md` § "Call-time constant resolution" (including the
"ESM has no equivalent" paragraph, which is the technical claim this RFC
corrects), and the same section in `packages/arel/CLAUDE.md`,
`packages/activesupport/CLAUDE.md` and `packages/activerecord/CLAUDE.md`. The
arel one ends "This is the shape every package's plain `Owner.Name = klass`
assignment and any remaining slot converge onto" — the sentence aiming the
sweep the wrong way.

The backlog is still scheduled to finish the job, closed by story 13: `0154`'s
`namespace-seats-bind-through-rb-mod-const-set` (est 500 LOC) asks for exactly
the inverse, and fifteen `class-to-string-seat-enroll-<package>` stories enroll
each package in a lint rule writing a hand-seeded Ruby path literal per class —
the same registration-protocol mistake one layer down, and a duplicate of the
generated table in story 2.
