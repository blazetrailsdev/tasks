---
title: "Inline _excludingArgs/_countMatching/_patternMatcher/_whereMatchesUnscopedBaseline"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6618
claim: "2026-08-16T23:19:58Z"
assignee: "converge-ordered-options-constructor-and-dup"
blocked-by: null
closed-reason: null
---

## Context

Coverage gap from the 2026-08-16 refinement pass. The **where-family private
helpers** — invented decomposition behind `excluding`, `isNone`/`isAny`/`isOne`
and the unscoped-baseline check, none of which Rails extracts:

| member                          | `relation.ts` | lines | Rails                                                                             |
| ------------------------------- | ------------- | ----- | --------------------------------------------------------------------------------- |
| `_excludingArgs`                | `:1044`       | 37    | none — Rails inlines the validation in `excluding` (`query_methods.rb:1574-1586`) |
| `_whereMatchesUnscopedBaseline` | `:4454`       | 23    | none                                                                              |
| `_countMatching`                | `:2308`       | 14    | none — Rails' `one?`/`many?` use `limited_count` (`relation.rb:1498`)             |
| `_patternMatcher`               | `:2299`       | 9     | none — Ruby passes the pattern to `Enumerable#any?`/`one?` directly               |

~83 lines.

CLAUDE.md's "Decomposition" rule is the direct hit here: _"If Rails extracts a
private helper, extract it, with the Rails name. If Rails inlines something,
inline it."_ All four are TS-only extractions.

`excluding` (`query_methods.rb:1574`) raises `ArgumentError` inline for a
non-`ActiveRecord::Base`/`Relation` argument; `_excludingArgs` hoists that into a
37-line helper shared by `excluding` and `without`. Rails aliases `without` to
`excluding` (`query_methods.rb:1585`) rather than sharing a helper.

`_countMatching` / `_patternMatcher` back `isAny` / `isOne` / `isMany`
(`relation.rb:391`, `:404`, `:413`). Rails' bodies pass the block straight to
`records.any?` / `.one?` / `.many?`; the pattern-matching arm is Ruby's
`Enumerable` doing the work, not a relation-level matcher.

`_whereMatchesUnscopedBaseline` backs `isEmptyScope` (`relation.ts:4477`,
Rails `empty_scope?` `relation.rb:1299`), which in Ruby is a one-line
`values == klass.unscoped.values` comparison.

## Acceptance criteria

- All four helpers are inlined into their callers at the Rails bodies —
  `excluding` (`query_methods.rb:1574`), `any?`/`one?`/`many?`
  (`relation.rb:391`/`:404`/`:413`), `empty_scope?` (`relation.rb:1299`).
- `without` becomes an alias of `excluding` as Rails aliases it
  (`query_methods.rb:1585`), not a second caller of a shared helper.
- `isEmptyScope`'s body matches `relation.rb:1299`.
- No behavior change; `relation/where.test.ts`, `relation/where-chain.test.ts`
  and the `relation/` suites pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
