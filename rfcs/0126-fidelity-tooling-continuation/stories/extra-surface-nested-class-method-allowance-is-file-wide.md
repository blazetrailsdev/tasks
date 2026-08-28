---
title: "Scope nested-class method allowances to the porting TS class, not the whole file"
status: ready
updated: 2026-07-27
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5458 fixed the extra-surface false-positive by letting a nested Ruby class
contribute BOTH its constant name and its methods to the enclosing file's
allow-set (`scripts/api-compare/extra-surface.ts`,
`hasEnclosingClassInFile` + the `nestedInEnclosingClass` arm of
`collectAllowedNames`).

Admitting the methods was necessary: trails commonly ports a nested Ruby class
as a sibling `class Inner` in the same TS file, re-attached as
`static readonly Inner = Inner`. `tsClassesByFile` groups by file, so
`Inner`'s methods are already in the TS name set for that file and would score
as extra without the allowance.

The cost is precision, and it is exactly the hole the two superseded stories
(`extra-surface-allow-nested-class-names`,
`extra-surface-nested-class-methods-scored-asymmetrically`) warned about: the
allow-set is FLAT per file, so a nested class's method name is now allowed
anywhere in that TS file — including on the OUTER class, where Rails does not
declare it. A trails-invented method on `AbstractAdapter` that happens to share
a name with a method on `AbstractAdapter::Version` no longer flags.

## Acceptance criteria

- Nested-class method allowances are scoped to the TS declaration that ports
  the nested class (the same-named TS class in the file, or the class carrying
  the `static readonly Inner = Inner` member), not unioned into the file-wide
  allow-set.
- A method Rails declares ONLY on the nested class, appearing on the outer TS
  class, scores as extra again.
- The 143-extra reduction PR #5458 measured does not regress: every currently
  clean nested family (`StatementPool` x3, `JoinDependency::Aliases`,
  `Preloader::LoaderQuery`, `StatementCache::Substitute`, `SQLite3Integer`,
  `OID::Bit::Data`, `AbstractAdapter::Version`) stays clean.
- Tests in `scripts/api-compare/extra-surface.test.ts` cover both directions.
- Record the before/after per-package `totalExtras` (baseline after #5458:
  4065 -> 3922 total; activerecord 1669).

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
