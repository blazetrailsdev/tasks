---
title: "TS extractor drops dynamically-named describe titles, losing an ancestor from every test inside"
status: done
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: 7351
claim: "2026-09-01T17:59:08Z"
assignee: "test-compare-gate-stack-does-not-follow-a-helper-call"
blocked-by: null
closed-reason: null
---

## Context

PR #7241 taught the TS test extractor to record a dynamically-named
`it()` / `test()` under the template's static skeleton
(``it(`${name} raises X`)`` → `"<expr> raises X"`, flagged `dynamic` so it
counts as extra and never matches a Rails test —
`getArgTitle` / `getArgTemplateSkeleton`, `scripts/test-compare/extract-ts-core.ts`).

The SUITE side still has the gap. `describe` and the gate wrappers read their
title with `getArgString` only (`extract-ts-core.ts`, the
`ADAPTER_SUITE_WRAPPERS` / `describeIfSupports` / `.skipIf` branches), so a
`describe(`${adapter} quoting`, …)` returns null, `enterSuite` is never called,
and the walk falls through to `ts.forEachChild`. The tests inside are still
recorded — but with the enclosing describe MISSING from their `ancestors`, so
their `path` is wrong.

A bare IDENTIFIER title is the same bug with no skeleton to fall back on:
`describe(name, ...)` inside a `function makeSuite(name, ...)` helper returns
null from `getArgString` exactly as a template does, but there is no static text
to recover a name from. Confirmed in the field — `migration/foreign-key.test.ts`
generated its three `ForeignKeyChangeColumn*` suites from a
`foreignKeyChangeColumnTest(name, prefix, suffix)` helper, and all six contained
`it`s were attributed to the outer `Migration` describe, surfacing as six
wrong-describe rows that sat undetected until
`port-migration-foreign-key-residue-and-mysql2-rake-skips` (#7252) inlined the
three describes by hand. Whatever this story does for templates has to at least
NOT silently reparent the identifier form; the honest fallback is to record the
suite under an opaque dynamic placeholder so its children keep a complete
ancestor chain and simply never match.

That is worse than the `it()` case was: a wrong path is not inert. Pass 1 keys
on the full path and pass 1.5 on a path suffix, so a test under a dropped
describe silently demotes to a pass-2 description-only match (counted as "wrong
describe"), or mis-pairs. It also feeds the sibling-class keying landed in the
same PR, which reads the TS describe names to decide whether a class is
recoverable.

## Converged shape

Route the suite branches through the same `getArgTitle` the test branches now
use, so a template-titled describe enters `enterSuite` under its skeleton
(`"<expr> quoting"`) and its children keep a complete ancestor chain. The
skeleton must not become a match key in its own right — a dynamic suite name
cannot equal a Rails describe — so propagate the dynamic flag to the contained
cases, or exclude a path containing the placeholder from the path indexes the
way `dynamic` cases are excluded today (`compare.ts`).

## Acceptance criteria

- [ ] A `describe` / `describeIfSupports` / `describeIfPg` / `.skipIf(...)` form
      with a template-literal title enters the suite rather than falling
      through, and its contained tests carry it in `ancestors`.
- [ ] A recovered suite skeleton never credits a Rails test: the contained cases
      are not matched on a path containing the placeholder.
- [ ] A `describe` whose title is a bare identifier (the helper-generated
      `describe(name, ...)` form) does not silently drop out of the ancestor
      chain: its children either carry an opaque dynamic placeholder or are
      excluded, never reparented onto the enclosing suite.
- [ ] A unit test covers a template-titled describe wrapping a static `it`, and
      one covers the identifier-titled form.
- [ ] `pnpm parity:test --gates --check` stays at exit 0; report the movement in
      matched / wrong-describe.
