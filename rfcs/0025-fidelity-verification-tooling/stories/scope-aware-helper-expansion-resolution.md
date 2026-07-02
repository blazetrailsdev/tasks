---
title: "test:compare — scope-aware (per-suite/class) helper resolution for assertion counts"
status: ready
updated: 2026-07-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4390 (symmetric recursive helper expansion for assertion
counts). Both extractors resolve same-file helper calls via a FLAT, name-keyed
map with NO lexical-scope tracking:

- TS `collectHelpers` (scripts/test-compare/extract-ts-core.ts) walks the whole
  file collecting every `function`/arrow decl at any nesting depth; last
  definition wins on name collision.
- Ruby `collect_helper_defs` (scripts/test-compare/extract-ruby-tests.rb)
  collects every `:def` file-wide (not per-class).

Consequence: two same-named helpers in different suites/classes collide, so a
test could fold in the WRONG helper body's assertion count. Documented as an
accepted static approximation (helper names are effectively file-unique on real
test files), but a reviewer flagged it twice as the residual risk.

## Acceptance criteria

- Scope helper resolution so a helper is matched to the caller's enclosing
  suite/class (TS: describe block; Ruby: class) rather than a flat file map,
  OR prove via a file-wide audit that no same-name cross-suite collisions exist
  in the vendored Rails + trails test corpus (and add a guard/test asserting so).
- Keep TS and Ruby resolution symmetric.
- Report-only; no CI gate. Add extractor unit tests for the shadowing case.
