---
title: "move-range-core-and-succ-to-corelib"
status: closed
updated: 2026-08-31
rfc: "0089-corelib-primitives"
cluster: null
deps: ["corelib-package-scaffold"]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by 0129-ruby-compat/move-range-core-and-succ-to-ruby-compat"
---

## Context

Moves the bare-Ruby `Range` core and its dependency to `packages/corelib/src/`.
**Non-overlapping files with `move-date-time-to-corelib`** so the two can run in
parallel.

`packages/activesupport/src/range-ext.ts` (97 lines) is not a Rails file. Its
`rangeIncludesStringValue` (`range-ext.ts:65-100`) is a line-by-line port of Ruby
`range.c` `range_include_internal` / `str_upto_each`, cites those C symbols in its
JSDoc, and is tagged `@noRailsEquivalent PERMANENT` at `range-ext.ts:19-22`. It
depends on `packages/activesupport/src/core-ext/string/succ.ts` (112 lines), which
ports `string.c` `rb_str_succ` and whose header already says it outright
(`succ.ts:6-8`): _"a Ruby core method, not a Rails extension, so it has no
`core_ext/string/_.rb` counterpart."\*

**Rails' own `core_ext/range/*` stays in activesupport** — `core-ext/range/`
is 1:1 with `vendor/rails/activesupport/lib/active_support/core_ext/range/`
(`compare-range.ts` 138, `conversions.ts` 89, `overlap.ts` 68, `each.ts` 63 =
358 lines, all anchored and measurable where they are). Moving them would charge
Rails' surface to a non-Rails package and destroy working `parity:api` coverage.

**This fixes a dependency inversion.** `core-ext/range/compare-range.ts:9,78-82,123-127`
— a properly anchored Rails core-ext file — currently reaches _upward_ into the
unanchored `range-ext.ts` for `rangeIncludesValue`, naming it `super` in its
JSDoc. Rails' real `compare_range.rb` calls Ruby's core `Range#cover?` there. The
dependency is correct in shape and pointing at the wrong package; after this move
it crosses a package boundary and means Rails-core-ext → Ruby-core, which is what
Ruby does.

## Acceptance criteria

- [ ] `range-ext.ts` and `core-ext/string/succ.ts` (+ their tests) moved to
      `packages/corelib/src/`.
- [ ] `core-ext/range/{compare-range,conversions,each,overlap}.ts` **stay** in
      activesupport and import `Range`/`rangeIncludesValue` from
      `@blazetrails/corelib`.
- [ ] `packages/activesupport/src/index.ts:516-517` re-exports updated (or
      removed in favour of a `corelib` import) without breaking existing callers.
- [ ] `activemodel/src/validations/clusivity.ts:21,218` updated.
- [ ] The `@noRailsEquivalent PERMANENT` tag on the `Range` interface is
      **re-evaluated**: once anchored to `ruby/spec` it may no longer be
      "permanent". Do not copy the tag forward unexamined.
- [ ] `pnpm typecheck` green; range/clusivity tests pass.
