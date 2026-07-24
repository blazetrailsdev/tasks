---
title: "gateFromGuardExpr: align positive-adapter+feature mixing with Ruby mixed rule"
status: draft
updated: 2026-07-24
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5075 made `gateFromGuardExpr` (scripts/test-compare/gates.ts:150-165) drop a
POSITIVE adapterType term when mixed with a `mariadb` guard, mirroring the Ruby
extractor's `mixed` rule (`scripts/test-compare/extract-ruby-tests.rb:606-617`:
a positive adapter set is unsound when the condition mixes it with a feature OR
a guard). But the TS extractor still KEEPS a positive adapter set mixed with
`adapterSupports("x")` feature terms (gates.ts:144-148 / docstring lines
98-107, which asserts both dimensions are emitted). Ruby drops positive adapter
sets mixed with features and keeps only negated-adapter exclusions in pure
conjunctions (covered by `extract-ruby-gates.test.ts:90-114`).

Audit whether the TS keep-both behavior for adapter+feature compounds produces
wrong-gate false negatives/positives vs Ruby, and align it with the `mixed`
rule (positive → drop, exclusion → keep) the way #5075 did for guards. The
docstring's De-Morgan claim needs re-verifying against actual suite idioms
(e.g. `skipIf(adapterType === "sqlite" || !adapterSupports("insert_returning"))`
is an exclusion — sound; `skipIf(adapterType !== "mysql" || !adapterSupports(x))`
is positive-mixed — unsound under Ruby's rule).

## Acceptance criteria

- [ ] `gateFromGuardExpr` treats positive-adapter+feature compounds the same
      way Ruby's `mixed` rule does (drop positive, keep exclusion), or a
      call-site-documented justification for keeping both, backed by a
      `test:compare --gates` delta showing no new mismatch rows.
- [ ] Unit tests in extract-ts-gates.test.ts cover both polarities for the
      feature-mixed case.
