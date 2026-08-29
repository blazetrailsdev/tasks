---
title: "Ruby's Range and its String#succ dependency move to ruby-compat, fixing the core-ext dependency inversion"
status: draft
updated: 2026-08-29
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "activemodel"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/range-ext.ts` (199 lines) declares Ruby's core
`Range` — `begin` / `end` / `excludeEnd`, `first`, `last`, `cover?`-style
`rangeIncludesValue`, and the `succ`-enumerating `rangeIncludesStringValue`
which is a line-by-line port of `range.c` `range_include_internal` /
`str_upto_each`. It is tagged `@noRailsEquivalent PERMANENT` (`:25-30`) with the
reason "`Range` is a core Ruby class, not a Rails declaration", and it depends on
`packages/activesupport/src/core-ext/string/succ.ts` (112 lines), itself a port of
`string.c` `rb_str_succ`, tagged the same way (`succ.ts:6-8`).

**Moving it fixes a real dependency inversion.** Rails' `core_ext/range/*.rb`
files are ported 1:1 under `activesupport/src/core-ext/range/` and are properly
anchored; `compare-range.ts:9,78-82,123-127` reaches _upward_ into the unanchored
`range-ext.ts` for `rangeIncludesValue`, naming it `super` in its JSDoc. Rails'
real `compare_range.rb` calls Ruby's core `Range#cover?` there. After the move the
edge crosses a package boundary and means Rails-core-ext → Ruby-core, which is
what Ruby does.

**Stays in activesupport** (1:1 with
`vendor/rails/activesupport/lib/active_support/core_ext/range/`, and moving them
would destroy working `parity:api` coverage): `core-ext/range/overlap.ts` (Rails
`Range#overlap?`), `conversions.ts` (`#to_fs`), `each.ts` (`#each`/`#step`),
`compare-range.ts` (`#===`/`#include?`).

**The `declare module` trap.** Three anchored files augment the Range class
through `declare module "../../range-ext.js"` — `compare-range.ts:18`,
`overlap.ts:64`, `conversions.ts:15`. **A re-export shim does not carry a module
augmentation**, so those three must retarget `@blazetrails/ruby-compat` in this
same PR; deferring them to the shim-deletion story leaves the augmentations
pointing at a file that no longer declares the class.

Other importers: `activesupport/src/index.ts:693` (public re-export),
`time-with-zone.ts:9`, `core-ext/object/json.ts:5` (as `RangeValue`),
`core-ext/date-and-time/calculations.ts:20`, and
`activemodel/src/validations/clusivity.ts:85` (a comment reference).

Per the standing rule, **trim on the way**: check `first()` / `last()` and each
comparator against real call sites and delete anything nothing reaches.
`range-ext.ts:15`'s private `cmp` is `<=>` and belongs to the `Comparable`
story — coordinate, do not duplicate it.

Do not pull in the three divergent Range VALUE shapes
(`activerecord/.../postgresql/oid/range.ts:26-31`,
`activerecord/src/attribute-methods/time-zone-conversion.ts:375-382`); those are
unrelated node/type classes and their unification is its own filed work.

## Acceptance criteria

- `Range` and `succ` live under `packages/ruby-compat/src/`, with
  `vendor/ruby/range.c:LINE` and `vendor/ruby/string.c:LINE` citations and their
  existing receipts.
- `range-ext.ts` and `core-ext/string/succ.ts` become re-export shims;
  `activesupport/src/index.ts:693` still exports `Range` from
  `@blazetrails/activesupport`.
- `compare-range.ts:18`, `overlap.ts:64` and `conversions.ts:15` retarget their
  `declare module` at `@blazetrails/ruby-compat` **in this PR**.
- `compare-range.ts`'s upward reach becomes a cross-package import; its JSDoc
  note about calling `super` updated to say it calls Ruby's core `Range#cover?`.
- Any member with no call site is deleted rather than moved; the PR body lists
  each kept member with the call site that justifies it.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params`, `parity:api:extra` show no new rows; the four anchored
  `core-ext/range/*` files keep their coverage.
- `range-ext.test.ts` and the succ tests move with the code, names unchanged.
- If the story exceeds the LOC ceiling, ship `Range` and file `String#succ`
  as a follow-on story — do NOT fan out a sibling PR.
