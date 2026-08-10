---
rfc: "0089-corelib-primitives"
title: "corelib: a home for the Ruby interpreter primitives trails emulates"
status: postponed
created: 2026-08-05
updated: 2026-08-05
owner: "@deanmarano"
packages:
  - "corelib"
  - "activesupport"
  - "activemodel"
  - "activerecord"
clusters: []
related:
  - "0088-date-gem-port"
priority: null
---

# corelib: a home for the Ruby interpreter primitives trails emulates

Trails emulates a handful of Ruby **interpreter** primitives — `Range`,
`String#succ`, `Module#include`/`#extend`/`#prepend` — in files that have no
Rails counterpart and therefore cannot be measured by `parity:api`. Give them a
package and a behavioral anchor.

This is the sibling of RFC `0088-date-gem-port`. **The two are deliberately
separate packages** because they have different anchoring contracts; see
_The split_ below.

## Status: postponed

**Nothing here is being worked.** RFC 0088 (the `date` gem port) is the active
effort; this RFC is parked so that effort stays focused, and its stories are
downgraded out of the ready queue by the non-active parent rule
(`scripts/validate-lib.mjs:44`).

It is **postponed, not withdrawn**, and the distinction matters. The finding
stands: **565 lines of Ruby interpreter emulation across four files have no
anchor and cannot be measured by `parity:api`** —

- `activesupport/src/range-ext.ts` (97) — ports `range.c` `range_include_internal`
  / `str_upto_each`, tagged `@noRailsEquivalent PERMANENT` (`range-ext.ts:19-22`)
- `activesupport/src/core-ext/string/succ.ts` (112) — ports `string.c`
  `rb_str_succ`, tagged `@noRailsEquivalent PERMANENT` (`succ.ts:6-8`)
- `activesupport/src/include.ts` (239) — `Module#include`/`#extend`,
  `Included<>`/`Extended<>` (`include.ts:10,94,187`)
- `activesupport/src/prepend.ts` (117) — `Module#prepend` (`prepend.ts:12-15`)

Parking this RFC does **not** declare that gap acceptable. It says the date port
is the higher-value target first, and that this work is scheduled after it rather
than abandoned. The `file:line` inventory below exists precisely so reactivating
costs a read, not a re-derivation.

**To reactivate:** flip `status` to `active` and set a `priority`. The stories
return to the ready queue automatically.

## Why

`scripts/api-compare/extra-surface.ts:12` walks _from each Ruby file_ to its
expected TS file. A TS file with no Ruby counterpart lands in the
`rubyFile === null` slice (`extra-surface.ts:531`) — counted as extra surface,
never compared method-by-method. Files emulating bare Ruby therefore drift
invisibly, exactly as the date cluster did before RFC 0088.

The repo has already _named_ this category in a JSDoc tag and has nowhere to put
it. `packages/activesupport/src/core-ext/string/succ.ts:6-8`:

> `@noRailsEquivalent PERMANENT` — Ruby core `String#succ` (string.c
> `rb_str_succ`), which Rails inherits rather than defines. **"a Ruby _core_
> method, not a Rails extension, so it has no `core_ext/string/*.rb`
> counterpart."**

## The population

| Item                                                           | Ruby feature                                                    | Location                                    | Lines | Anchor today                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| `Range` core                                                   | `Range#include?`, `#cover?`, `exclude_end?`, `succ`-enumeration | `activesupport/src/range-ext.ts`            | 97    | **none** — `@noRailsEquivalent PERMANENT` (`range-ext.ts:19-22`)                        |
| `String#succ`                                                  | `rb_str_succ`                                                   | `activesupport/src/core-ext/string/succ.ts` | 112   | **none** — `@noRailsEquivalent PERMANENT` (`succ.ts:6-8`)                               |
| `Module#include`/`#extend` + hooks + `Included<>`/`Extended<>` | `Module#include`                                                | `activesupport/src/include.ts`              | 239   | **none** — _"Mirrors: Ruby's Module#include (core language feature)"_ (`include.ts:10`) |
| `Module#prepend`                                               | `Module#prepend`                                                | `activesupport/src/prepend.ts`              | 117   | **none** — `prepend.ts:12-15`                                                           |

**565 lines, zero anchored.**

`range-ext.ts` is the clinching case. Its `rangeIncludesStringValue`
(`range-ext.ts:65-100`) is a line-by-line port of Ruby's `range.c`
`range_include_internal` / `str_upto_each`, cites those C symbols in its JSDoc,
and depends on `succ.ts` — itself a port of `string.c`. That is structurally
identical to what RFC 0088 found in `date.ts`: Ruby C source, cited by symbol,
with no Rails file to compare against.

## The split — why this is not RFC 0088

**`date` is a gem; these are the interpreter.** Not a taxonomy quibble — it
decides what can be measured and how:

|                   | `packages/date` (RFC 0088)                     | `packages/corelib` (this RFC)     |
| ----------------- | ---------------------------------------------- | --------------------------------- |
| Upstream          | `ruby/date` gem — own gemspec, `lib/`, `test/` | `range.c`, `string.c`, `eval.c`   |
| Vendorable source | **Yes**                                        | **No** — not a distributable unit |
| Vendorable tests  | **Yes** — `test/date/*.rb`                     | Only `ruby/spec`                  |
| `parity:api`      | **Yes**                                        | **Never**                         |
| `parity:test`     | **Yes**                                        | Yes, against `ruby/spec`          |
| Precedent         | `did-you-mean`, `globalid`, `rack`, `i18n`     | none — genuinely new              |

An earlier draft folded both into one package. Folding them would have made
"which contract applies here?" a rule contributors had to remember; **two
packages make it structural.** It also lets RFC 0088 follow the working
vendored-gem precedent unchanged instead of inventing a half-anchored hybrid.

**`corelib` never enrolls in `parity:api`.** `Module#include` lives in
`eval.c`/`class.c` as an interpreter internal; there is no portable source to
mirror method-by-method, only behavior. `compareApi: false` here is permanent,
not a flag a later story flips — and that is the single most important thing to
carry forward from this RFC.

## Scope

**In:** `Range` core (the begin/end/excludeEnd triple, `cover?`, `include?` via
`succ`-enumeration), `String#succ`, and the module-mixin primitives —
`include()`, `extend`, `prepend()`, the `included`/`extended` hook symbols, and
the type-level halves `Included<>` (`include.ts:94`) and `Extended<>`
(`include.ts:187`) with their shared `CallableMethods` helper (`include.ts:63`).
The runtime functions and their types move as one unit.

**Out — anything with a `.rb` counterpart stays where it is measurable.** Moving
it would charge Rails' surface to a non-Rails package and _destroy_ working
`parity:api` coverage, the exact inverse of the problem being solved. Verified
counterparts exist for: `concern.ts` (`concern.rb`), `delegation.ts`
(`delegation.rb`), `class-attribute.ts` (`class_attribute.rb`),
`descendants-tracker.ts` (`descendants_tracker.rb`),
`core-ext/object/blank.ts`, `try.ts`, `transliterate.ts`, `inflector.ts`,
`core-ext/big-decimal/*`, and `module-ext.ts` (mostly Rails: `delegate`,
`mattr_accessor`, `cattr_accessor`, `attr_internal`).

Also out, and deliberately so: the `*-adapter.ts` family (Node platform
abstraction, not Ruby semantics) and the `*-utils.ts` family (helper grab-bags;
some are likely mis-filed Rails core-ext, which is RFC 0023 territory and must
not be smuggled in here). **Scope sprawl is this package's main risk** — the name
is `corelib`, not `core`, for that reason.

### The Range split

`core-ext/range/` is **1:1** with
`vendor/rails/activesupport/lib/active_support/core_ext/range/`:

| Moves to `corelib` (unanchored Ruby core)                          | Stays in activesupport (1:1 anchored Rails)                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `range-ext.ts:14-26` — the begin/end/excludeEnd triple             | `core-ext/range/overlap.ts` (68) — Rails `Range#overlap?`          |
| `range-ext.ts:37-45` `rangeIncludesValue` — Ruby `cover?`          | `core-ext/range/conversions.ts` (89) — Rails `#to_fs`              |
| `range-ext.ts:65-100` `rangeIncludesStringValue` — Ruby `include?` | `core-ext/range/each.ts` (63) — Rails `#each`/`#step`              |
| `core-ext/string/succ.ts` (112) — its dependency                   | `core-ext/range/compare-range.ts` (138) — Rails `#===`/`#include?` |
| **209 lines**                                                      | **358 lines**                                                      |

**This fixes a dependency inversion.** `core-ext/range/compare-range.ts:9,78-82,123-127`
— a properly anchored Rails core-ext file — currently reaches _upward_ into the
unanchored `range-ext.ts` for `rangeIncludesValue`, naming it `super` in its
JSDoc. Rails' real `compare_range.rb` calls Ruby's core `Range#cover?` there. The
dependency is correct in shape and pointing at the wrong package; after the move
it crosses a package boundary and means Rails-core-ext → Ruby-core, which is what
Ruby does.

## Vendoring

`ruby/spec` at a **pinned dated SHA**, scoped to `core/module`, `core/range`,
`core/string` — not the whole spec suite. `parity:test` only.

## Dependency direction

`corelib` is a leaf: it depends on nothing (the `Range` comparators and `succ`
are self-contained, and `include.ts`/`prepend.ts` are pure TS reflection).
`packages/date` does **not** depend on it; the two are independent leaves.
activesupport/activemodel/activerecord depend on `corelib`.

## Out of scope — filed separately

- The three divergent `Range` value shapes (`range-ext.ts:14`,
  `activerecord/src/connection-adapters/postgresql/oid/range.ts:26-31`,
  `activerecord/src/attribute-methods/time-zone-conversion.ts:375-382`) → RFC
  0023, `unify-three-range-value-shapes`, which is blocked on this RFC's range
  move landing.
- RFC 0074's four `i18n-inspect-*` stories are Ruby `Object#inspect` semantics
  and may belong here in a later wave → RFC 0023,
  `i18n-inspect-stories-are-ruby-object-inspect`. **Flagged, deliberately not
  pulled in.**

## Constraints

- Each PR under the LOC ceiling; one story per PR; PRs branch from `main`, no stacking.
- `compareApi` stays `false` for `ruby_spec` permanently.
