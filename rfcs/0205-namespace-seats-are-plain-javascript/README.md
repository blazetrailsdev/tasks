---
rfc: "0205-namespace-seats-are-plain-javascript"
title: "Lean on ES imports: namespace seating survives only where module evaluation order needs it"
status: active
created: 2026-10-22
updated: 2026-10-28
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
priority: null
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

### The Ruby name is printed from a ruby-compat table, never looked up

A seat also wrote the `classpaths` WeakMap, so `rbModName` answers
`"Arel::Nodes::Not"` rather than JavaScript's `"Not"`. That name is real Rails
output — `inspect`, error messages, an STI `type` value, `compute_type`'s
candidate names (`activerecord/lib/active_record/inheritance.rb:255-261`), i18n
keys — so ruby-compat keeps a generated class → Ruby name table per package and
`rbModName` reads it.

That is the table's whole job. By repo-owner ruling (2026-10-28, trails#9424):

- It answers class → name, and nothing else. It is never a name → class
  lookup; `generatedClass` and `constantize`'s fallback to it are debt.
- It is a ruby-compat internal. Outside ruby-compat only the generated
  `class-paths*.generated.ts` files call `registerClassPaths`; hand-written
  code reaches a name through `rbModName` / `rbInspect` only.

### Lookup is an ES import or an explicit registry

Ruby finds a class by name at run time (`constantize`, `const_get`,
`const_defined?`, `constants`, `path2class`). trails does not port that
lookup, **even where the Rails body calls it**: this is JavaScript, and a class
is reached the way JavaScript reaches it (repo-owner ruling, 2026-10-28,
recorded in root CLAUDE.md § "Constant lookup is an import or a registry").

- **A known name is an ES import.** A literal name, or one from a set the
  framework closes (adapters, coders, type names, chronic handlers), is an
  import, or a module-private map or `switch` beside the reader.
- **An open set of application classes is an explicit registry.** Models (STI
  `type`, polymorphic `_type`, `class_name:`, GlobalID) go through
  `registerModel`, routed controllers through `registerController`, jobs
  through `registerJob`, channels and connections through `registerChannel` /
  `registerConnection`. Each registry keeps its own map and exports a name →
  class read beside it; a domain with no registry gets one of the same shape,
  never a generic constant lookup.
- **`registerConstant` and the top-level constant table `RCLASS_CONST_TBL`
  are deleted**, as are the outside-ruby-compat calls to `rbModConstGet`,
  `rbModConstDefined`, `rbModConstants`, `rbPathToClass`, `registeredConstant`,
  `constantize` and `safeConstantize`.

Measured on 2026-10-28 (non-test source): `registerConstant` 279,
`constantize` 44, `safeConstantize` 30, `rbModConstGet` 28,
`registeredConstant` 16, `isRegisteredConstant` 12, `rbPathToClass` 8,
`rbModConstDefined` 7, `rbModConstants` 3. Tests add 2,674 `registerX` calls,
which stay: they are the target shape.

This supersedes the 2026-10-27 ruling, which replaced the `registerX` APIs
with a per-application class-path table filled by trailties' boot scan.

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

The seat and read arm (landed or in flight): CLAUDE.md amendments, the
per-package sweeps converting deferred reads to imports, the
`rbModConstSet` gate, and the module-eval survivors.

The lookup arm burns down in this order:

1. **Gate** — `gate-constant-lookup-calls-outside-ruby-compat`: an only-shrink
   per-file count of the lookup calls above, against the `origin/main`
   merge-base, as `parity:api:sends` does. `registerX` is not counted.
2. **Registry read sides** — `register-x-registries-gain-a-read-side`: each
   `registerX` keeps its own map and stops writing through
   `registerConstant`; `compute_type` is the proof reader.
3. **Readers convert** — `framework-constantize-calls-become-imports-or-registries`
   and `constant-lookup-helpers-keep-only-rails-const-get-sites`: every site
   becomes an import, a module-private map, or a `registerX` read. A Rails
   `const_get` at the site is not a reason to keep it.
4. **Table boundary** — `class-path-table-api-is-ruby-compat-internal`: a lint
   holding the class-path API inside ruby-compat; `inflector.ts`'s
   `generatedClass` fallback and the hand-written actionpack row go.
5. **Seats go** — `framework-register-constant-seats-retire-onto-class-path-tables`
   (rescoped: seats are deleted once nothing reads them) and
   `test-suites-drop-register-model-and-register-constant` (rescoped: tests
   drop `registerConstant` only; `registerModel` stays).
6. **Finish** — `delete-register-constant-and-the-top-level-constant-table`.

Each conversion must re-run the ESM entry-module check CLAUDE.md
§ "Call-time constant resolution" prescribes — a plain-node import of the
**built** `dist/**.js` modules as entry modules, because a vitest run enters a
funnel module first and masks a TDZ.

## Out of scope

- **`ActiveSupport::Autoload` and the namespace objects' own existence.** The
  objects stay — they remain the public `Arel.Nodes` / `ActiveRecord.Base`
  surface a Rails developer reaches for, and RFC 0151 settled the autoload
  layer. This RFC changes how _framework-internal_ code reaches a class.
- **Dropping the qualified Ruby path.** It is Rails-visible output, and
  ruby-compat keeps it for printing a name.
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

**A per-application class-path table filled by a boot scan, in place of
`registerX`.** This was the 2026-10-27 ruling. Rejected by the repo owner on
2026-10-28: it routed name → class lookup through tables generated by the
parity scripts and grew a story for every edge case of a class learning its own
name (deep imports, renames, nested classes, entry-less packages). The
registries are plain JavaScript and already exist.

**Keep `constantize` / `const_get` wherever the Rails body calls it.**
Rejected on 2026-10-28: "I don't even want 'justified by rails' — this is js,
we want to do js as natively as possible."

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
