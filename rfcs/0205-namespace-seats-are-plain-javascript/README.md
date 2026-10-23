---
rfc: "0205-namespace-seats-are-plain-javascript"
title: "A namespace seat is a plain JavaScript assignment: remove rbModConstSet from every site Rails does not const_set"
status: active
created: 2026-10-22
updated: 2026-10-23
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
clusters:
  - design
  - retire
  - conversion
  - tooling
related-rfcs:
  - "0151-activesupport-autoload-slot-registry"
  - "0154-ruby-compat-surfaced-deviations"
  - "0197-plain-object-modules-replace-ruby-compat-module"
priority: 2
---

# RFC 0205 — A namespace seat is a plain JavaScript assignment

## Summary

Seating a class on its namespace object is spelled
`rbModConstSet(Owner, "Name", Klass)` in 790 places across 407 files. The
operation underneath is `Owner.Name = Klass` — one JavaScript property
assignment — and the helper's only other effect is a write into a
`classpaths` WeakMap so `rbModName` answers `"Arel::Nodes::Not"` rather than
JavaScript's own `"Not"`.

Rails calls `const_set` in **18 places** in the whole vendored tree. We call
our port of it in **790**. The 772-site difference is not fidelity; it is a
registration protocol trails invented, mandated in CLAUDE.md, and is still
actively converging plain JavaScript assignments _into_.

This RFC reverses that. The qualified Ruby path is kept — it is real Rails
behaviour, visible in `inspect`, error messages, STI type columns and i18n
keys — but it is **derived** from facts the port already holds instead of
registered at every declaration. The 39 namespace objects each already carry
their own fully-qualified path in `name` (`{ name: "Arel::Nodes" }`), so a
seated class's path is `owner.name + "::" + key`: 39 facts in 13 files replace
790 calls in 407. `rbModConstSet` survives only where the Rails body itself
says `const_set`.

## Why this is wrong today

**It is an invented call at 772 sites, and no gate can see it.** CLAUDE.md
§ "Fidelity is the job" forbids a call Rails does not make, and § "Before you
open the PR" says plainly that an added call is invisible to both call gates:
they flag what Rails does and the port omits, never the reverse. So the one
deviation class the ratchets structurally cannot catch is the one that grew
from 15 sites to 790 in four weeks — every one of them a call whose Rails
counterpart is a bare assignment.

**It launders the type check.** `rbModConstSet` takes
`(mod: Module | { readonly name: string } | …, id: string, value: T)`. Nothing
relates `value` to the declared type of `mod[id]`, so a seat of the wrong
class, or onto the wrong owner, type-checks. `Nodes.Not = Not` does not: the
namespace objects are typed (`typeof NodesModule`), and the assignment is
checked against the declared property. Routing 790 assignments through an
untyped three-argument call discards a compile-time guarantee TypeScript was
giving us for free. This is the "sidestepping JavaScript" cost, and it is not
only aesthetic.

**It is a side table where JavaScript has the fact.** `rbModName` is
`classpaths.get(klass)?.path ?? klass.name ?? null` — the JS fallback is
already there, and the table exists only to supply the `::` prefix. The prefix
is not new information: it is the owner's `name` plus the key the class is
seated under, both of which the seat expression itself contains. The table
records, at 790 call sites, something derivable from 39.

**It reads as framework ceremony, not as Rails.** A Rails developer reading
`arel/nodes/binary.rb` sees `class Join < Binary; end` and no registration
line at all. Our counterpart carries an import of `rbModConstSet` and a
trailing call. Multiply by 407 files. The bar in CLAUDE.md is "would a Rails
dev recognise this as the same method"; a per-declaration registration
protocol that Rails has no line for does not clear it.

## The design

### A seat is `Owner.Name = Klass`

```ts
// packages/arel/src/nodes/binary.ts
export class Join extends Binary {}
Nodes.Join = Join;
```

No import, no helper, type-checked against `Nodes`' declared property. This is
what every package outside arel and `activemodel/src/attribute.ts` already
does, and the direction CLAUDE.md currently points _away_ from.

### A class's Ruby path is derived on first read, not registered

`registerNamespace(ns)` records each of the 39 namespace objects in
`namespaces.ts`, once, beside the `registerConstant` call that is already
there. `rbModName(klass)` then resolves in this order:

1. a path already memoized for `klass` — the `classpaths` WeakMap stays, as an
   internal **cache of a derivation** that no call site writes to;
2. a `const_set`-bound path, for the Rails sites that genuinely call it;
3. a derived path: the first registered namespace holding `klass` as an own
   property, giving `owner.name + "::" + key`, memoized;
4. `klass.name` — JavaScript's own answer, for an unseated class;
5. `null`, for an anonymous one.

Step 3 is a walk over 39 objects on the first `name` read per class and never
again. It replaces 790 eager writes with a lazy lookup, which is also the
shape that stops the mechanism propagating: a new class seated with a plain
assignment is pathed correctly with nothing added at its declaration.

### `rbModConstSet` survives only where Rails says `const_set`

The helper is a faithful port of `Module#const_set`
(`vendor/ruby/v3.3.11/variable.c:3648-3668`) and stays exported for the sites
whose Rails body calls it — the generated-module and generated-class cases,
where there is no declaration to assign at and the constant name is computed:

| Rails site                                                                         | what it binds                                |
| ---------------------------------------------------------------------------------- | -------------------------------------------- |
| `activerecord/lib/active_record/attribute_methods.rb:43`                           | `GeneratedAttributeMethods`                  |
| `activerecord/lib/active_record/core.rb:340`                                       | `GeneratedAssociationMethods`                |
| `activerecord/lib/active_record/relation/delegation.rb:40,65`                      | mangled delegate, `GeneratedRelationMethods` |
| `activerecord/lib/active_record/associations.rb:1877`                              | a HABTM join model                           |
| `activerecord/lib/active_record/associations/builder/collection_association.rb:26` | an extension module                          |
| `activerecord/lib/arel/nodes/{binary,unary,function}.rb`                           | the generated node classes                   |
| `activemodel/lib/active_model/attribute_methods.rb:584`                            | an `ATTR_` name constant                     |
| `actionpack/lib/abstract_controller/helpers.rb:232`                                | `HelperMethods`                              |
| `actionview/lib/action_view/template.rb:189`                                       | `Types`                                      |
| `activesupport/lib/active_support/concern.rb:212`                                  | `ClassMethods`                               |
| `activesupport/lib/active_support/core_ext/module/concerning.rb:133`               | a `concerning` topic                         |
| `activesupport/lib/active_support/testing/constant_stubbing.rb:33-45`              | a stubbed constant                           |
| `railties/lib/rails/app_loader.rb:57`                                              | `Object::APP_PATH`                           |

That is the whole permitted population: 18 Rails sites, and a trails call site
is legitimate exactly when it mirrors one of them. The rule is the ordinary
fidelity rule, not a new register — which is why it needs no baseline and no
receipt shape. `rbModConstGet` / `rbModConstDefined` / `rbModConstants` /
`registerConstant` are untouched: those stand in for dynamic lookups Rails
really does make (adapter resolution, validator lookup), and there are nine of
them.

## Scope

Stories 1–2 land the rule and the derivation. Stories 3–11 are the per-package
sweeps, each mechanical: rewrite the seats as assignments, drop the imports,
fix whatever the now-live type check rejects. Story 12 adds the gate. Story 13
reverses the backlog that is still pushing the other way.

Sweep sizes (seats, excluding import lines):

| package      | seats | package             | seats |
| ------------ | ----- | ------------------- | ----- |
| activerecord | 242   | activemodel         | 34    |
| arel         | 144   | msgpack             | 19    |
| actionpack   | 98    | activesupport       | 16    |
| actionview   | 64    | trailties           | 14    |
| activejob    | 60    | small packages      | 22    |
| actioncable  | 40    | ruby-compat (tests) | 38    |

Each sweep must re-run the ESM entry-module check CLAUDE.md
§ "Call-time constant resolution" prescribes: a plain assignment is the same
module-eval edge the helper call was, so no cycle changes, but the check is
cheap and the failure mode is a TDZ throw at import time rather than a test
red.

## Out of scope

- **The namespace objects themselves, and `ActiveSupport::Autoload`.** The
  call-time property read (`new Nodes.Not(this)`) is ratified and correct, and
  RFC 0151 settled the autoload surface. This RFC changes only how a class
  gets _onto_ the namespace.
- **Dropping the qualified path.** `"ActiveRecord::Base"` is Rails-visible
  behaviour; deriving it is the point, losing it is not. If a derived path ever
  disagrees with a seat-recorded one, the derivation is the bug.
- **Application autoloading**, ratified absent in CLAUDE.md § "Trails has no
  autoloader".

## Alternatives considered

**Keep the helper, add a lint rule bounding it.** Rejected: it leaves 790
invented calls in the tree and 790 unchecked assignments, and the rule would
have to carry an allowlist the size of the thing it bounds. The calls are the
problem, not their rate of growth.

**Drop the path and let `rbModName` answer `klass.name`.** Rejected: it loses
real Rails behaviour at prominent surfaces (STI type strings, error messages,
`inspect`, i18n keys), and the path is derivable, so nothing is bought.

**Derive the path eagerly at module load, from the namespace objects.**
Rejected: a namespace is populated as its members' modules evaluate, so an
eager walk either runs before the seats or needs a hook that fires after them.
The lazy read has no such ordering problem, and matches § "`inherited` is
deferred to own-property memo guards" — the repo's settled answer for "a fact
JavaScript has no definition-time hook for".

**A decorator on each class.** Rejected: it is the same per-declaration
ceremony with different syntax, and it is Rails-facing surface Rails has no
line for.

## What this RFC reverses

The propagation is doc-driven, so the docs change first. Four live texts tell
an agent to spell a seat with the helper, and all four are amended by story 1:

- root CLAUDE.md § "Call-time constant resolution": "each autoloaded constant
  is seated by its defining module with `rbModConstSet(Namespace, "Name",
Klass)` — the constant binding is what paths it, as Ruby's `const_set` does".
- `packages/arel/CLAUDE.md` § "Call-time constant resolution (arel)", which
  ends "This is the shape every package's plain `Owner.Name = klass`
  assignment and any remaining slot converge onto" — the sentence that aims the
  sweep in the wrong direction.
- the same section in `packages/activesupport/CLAUDE.md` and
  `packages/activerecord/CLAUDE.md`.

And an open backlog arm is still scheduled to finish the job, closed by story
13:

- `0154` `namespace-seats-bind-through-rb-mod-const-set` (est 500 LOC) —
  "Every namespace seat in activerecord, activesupport, actionview, actionpack
  and trailties … is `rbModConstSet(Owner, "Name", value)`". This is the direct
  inverse of this RFC and closes `FALSIFIED:`.
- `0154` `seated-classes-answer-module-name-with-their-constant-path` and
  `rb-path-to-class-reads-seated-path-whole-over-flat-constant-table` — rewrite
  onto the derivation.
- the fifteen `0154` `class-to-string-seat-enroll-<package>` stories, which
  enroll each package in a lint rule that writes a `static toString()` literal
  per class from a manifest. That is the same registration-protocol mistake one
  layer down — a hand-seeded constant path per declaration where the owner
  already knows it — and story 13 holds the unenrolled packages pending its own
  review rather than letting the arm continue by default.
