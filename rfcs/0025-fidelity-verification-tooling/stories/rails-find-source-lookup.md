---
title: "pnpm rails:find — map trails test/method names to vendored Rails file:line"
status: claimed
updated: 2026-07-13
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-07-13T21:22:33Z"
assignee: "rails-find-source-lookup"
blocked-by: null
closed-reason: null
---

## Context

Every fidelity task starts with "read the corresponding Rails code/test first"
(CLAUDE.md now points at `vendor/rails/` — merged in PR #4438), but the mapping
from a trails symbol to the vendored `file:line` is done by hand each time:
grep `vendor/rails/activerecord/lib/` for a method, or grep
`vendor/rails/activerecord/test/cases/` for a test name. `scripts/test-compare/`
already implements test-name matching (trails `*.test.ts` names ↔ Rails
`test_*` names) and `scripts/api-compare/` already extracts the Ruby API
surface (method → file:line via `extract-ruby-api.rb` cache). This lookup can
reuse both instead of re-deriving matches.

Repeated mis-specified stories (encrypted_posts, cpk_orders composite-PK,
firms/clients "missing tables") trace to agents skipping this manual lookup.

## Acceptance criteria

- `pnpm rails:find <query>` prints vendored `file:line` matches for:
  - a test name (exact or substring), via test-compare's matching logic
  - a method/constant name, via the api-compare Ruby extraction cache
- Falls back to a scoped grep of `vendor/rails/activerecord/` when neither
  index hits, and says which mode produced each result.
- Works from any worktree (reads that worktree's `vendor/rails`).
- Documented with one line in CLAUDE.md "Working in this repo".
