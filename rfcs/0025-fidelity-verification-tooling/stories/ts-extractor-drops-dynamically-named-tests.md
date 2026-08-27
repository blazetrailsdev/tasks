---
title: "TS test extractor drops dynamically-named it() calls, hiding TS-only tests from the extra count"
status: draft
updated: 2026-08-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ts-tests.ts` records a test case only when its
name is a static string literal. An `it(`${name} raises ...`)` inside a
`for` loop — the shape used by data-driven tests — produces no manifest entry
at all, so `pnpm parity:test` counts it neither as matched nor as
"extra (TS only)".

Found while emptying the arel Rails-named test files of TS-only tests
(PR #7125): after the 297 manifest-visible extras had moved, two
loop-generated groups in `packages/arel/src/visitors/to-sql.test.ts` were
still sitting in a Rails-named file, invisible to the gate that is supposed
to detect exactly that:

- `describe("value-class visitors aliased to unsupported")` — `for (const name
  of aliasNames) { it(`${name} raises UnsupportedVisitError`, ...) }`
- the nested `describe("raw values reaching visit dispatch on their class")` —
  `for (const [label, value] of [...]) { it(`raises UnsupportedVisitError for
  ${label}`, ...) }`

They were only found by grepping for `` it(` `` by hand. Any other package can
carry the same blind spot, and a purely mechanical audit will not see it.

## Acceptance criteria

- The TS extractor records a test case for a dynamically-named `it()` /
  `test()`, with whatever name form it can recover (the template's static
  skeleton with a placeholder for each `${}`, e.g.
  `` `${name} raises UnsupportedVisitError` `` → `"<expr> raises
  UnsupportedVisitError"`), rather than dropping the test.
- A recovered name never spuriously matches a Rails test: it can be counted as
  extra, but the matcher must not credit a Rails test against a placeholder.
- A one-line audit exists (a compare flag or a report line) naming files that
  contain dynamically-named tests, so the blind spot is visible rather than
  inferred.
- Sanity: re-running `pnpm parity:test` over a package with known
  loop-generated tests reports them.
