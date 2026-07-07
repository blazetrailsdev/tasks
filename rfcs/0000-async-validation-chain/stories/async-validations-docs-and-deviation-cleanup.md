---
title: "Remove sync-only deviation prose; verify Rails parity"
status: draft
updated: 2026-07-07
rfc: "0000-async-validation-chain"
cluster: null
deps: ["uniqueness-inline-delete-deferred-registry"]
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

Cleanup + verification tail of RFC 0000-async-validation-chain. The
sync-only architecture left tracked-deviation prose and guard comments
across the tree that become stale once the flip lands:

- `packages/activerecord/src/validations.ts:128-155` — the TRACKED
  DEVIATION block on `isValid` (uniqueness-not-run + the
  blocked-on-architecture rationale). Replace with a plain Mirrors:
  comment.
- `packages/activesupport/src/callbacks.ts` — any residual comments
  describing validations as sync-only (e.g. around the removed strict
  guard, `:51-53`, `:393`).
- Docs: grep `docs/`, `README.md`, `CONTRIBUTING.md` for
  sync-validation/sync-only-validations mentions and update (note:
  `docs/activerecord/` is frozen — if a stale mention lives there, record
  it in the PR body instead of editing).
- Verification: port/spot-check the Rails `validations_test.rb` cases that
  exercise `valid?` running DB-backed validators, confirm `test:compare`
  is non-negative for validations + uniqueness suites, and confirm
  grep-gate zero for `_asyncValidations`.

## Acceptance criteria

- No remaining prose in the tree claims validations are sync-only or
  documents the deferred-uniqueness deviation as current behavior.
- `test:compare` validations/uniqueness delta reported in the PR body.
- Docs-only/comment-only portions exempt from LOC ceiling; any test
  additions counted.
