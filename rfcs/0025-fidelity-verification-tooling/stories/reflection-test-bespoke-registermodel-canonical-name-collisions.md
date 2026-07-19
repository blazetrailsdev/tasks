---
title: "Audit bespoke registerModel calls that shadow canonical models file-wide"
status: draft
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `reflection.test.ts` in PR #4973.

`registerModel("Author", BespokeAuthor)` inside one `it()` overwrites the
global model-registry entry for **every later test in the file** — the
registry is global and is never torn down between tests. A later test using
the canonical `Author` then resolves association targets to the bespoke
class.

The failure mode is a **wrong value, not an error**: in #4973 the
`chain` test's through-chain silently collapsed from length 3 to length 1.
Nothing raises, so this can also mask a test that only appears to pass.

PR #4973 fixed exactly one instance (`reflection klass for nested class name`,
which registered a bespoke `Author`, was converged onto Rails'
`Reflection.create` form at
`vendor/rails/activerecord/test/cases/reflection_test.rb:126`).
`packages/activerecord/src/reflection.test.ts` still has ~60 `registerModel`
calls, several of which claim canonical names: `Category` (:469), `Firm`
(:822), `Client` (:823), `Owner` (:735/:756/:777/:798), `Hotel`
(:961/:1604), `Department`, `Chef`, `Ship`, `Part`, `Person`, `Address`,
`Project`, `Task`. Each is a latent trap for the next burndown slice and
several likely correspond to invented tables in
`scripts/schema-compare/invented-baseline.json` (`crews`, `firms`,
`clients`, ...).

Note `firms`/`clients` are STI on `companies` in Rails — not missing tables.

## Acceptance criteria

- Audit `registerModel` calls in `reflection.test.ts` (and any sibling test
  file with the same pattern) for names that collide with canonical models.
- Converge each colliding test onto the canonical model, reading the Rails
  test first; do not rename tests.
- Consider whether a cheap guard is warranted — e.g. `registerModel`
  warning/throwing when a bespoke class overwrites a name already held by a
  canonical model — so the next occurrence fails loudly instead of silently.
  Decide and note the outcome; do not add a guard that breaks legitimate
  re-registration.
- Existing reflection tests stay green.
