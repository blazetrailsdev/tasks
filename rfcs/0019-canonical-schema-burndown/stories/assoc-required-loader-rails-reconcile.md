---
title: "Reconcile non-Rails tests in required/loader-methods to Rails fidelity"
status: in-progress
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["associations-eager-join-cluster"]
deps-rfc: []
est-loc: 150
priority: 15
pr: 4148
claim: "2026-06-25T20:17:15Z"
assignee: "assoc-required-loader-rails-reconcile"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

The `required` (belongs_to `required:`/`optional:`) and `loader-methods`
association test files contain trails-only describes that drifted from Rails
shape during earlier canonical work. Reconcile them so every test either matches
a real Rails case or is justified as trails-internal.

- trails: `associations/required.test.ts`, `associations/loader-methods.test.ts`
  (confirm exact paths + exclude-JSON membership at claim time)
- Rails: the `belongs_to … required`/`optional` cases live in
  `associations/belongs_to_associations_test.rb`; preloader/loader behaviour in
  `associations/eager_test.rb`.

Already-canonical per prior PRs (#3117/#3119 lint-canonical work) — this is a
**fidelity reconcile**, not a schema conversion: align bodies to Rails and
delete or justify trails-only describes.

## Acceptance criteria

- [ ] For each test, find its Rails counterpart and match the body
      word-for-word, or document why it is trails-internal (no counterpart).
      Test names unchanged.
- [ ] Any remaining inline schema rides `TEST_SCHEMA`; no new exclude-JSON
      entries.
- [ ] Files lint-clean for `require-canonical-schema`, no `eslint-disable`.
- [ ] `pnpm vitest run <each file>` passes.

## Definition of done

Bodies match Rails where a counterpart exists; trails-only tests are explicitly
justified. An `eslint-disable` does **not** close this story.
