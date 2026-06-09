---
title: "Confirm + fix borderline genuine arity divergences"
status: draft
updated: 2026-06-09
rfc: "0000-api-compare-arity-divergences"
cluster: api-compare-arity-divergences
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Beyond `_insert_record` (story s1), the RFC triage surfaced four borderline
candidates — arity mismatches that _look_ like genuine divergences but could be
convention noise on close reading. Each must be confirmed against **both** the
Rails source and the TS port before any code is touched. Fix only the subset that
is genuinely divergent; reclassify the rest into the s3 ledger.

| Method                                                | Ruby                                 | TS                              | What to confirm                                                                                                                                                                               |
| ----------------------------------------------------- | ------------------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_chain` (`associations/association-scope.ts`)     | `(reflection, association, tracker)` | `(reflection, tracker)`         | Rails builds `Reflection::RuntimeReflection.new(reflection, association)` (`association_scope.rb:112`). Does the port re-derive `association` from `this`/`reflection`, or is it a real drop? |
| `render_exception` (`middleware/debug-exceptions.ts`) | `(request, exception, wrapper)`      | `(env, exception)`              | Does the port rebuild `wrapper` (the `ExceptionWrapper`) internally from `env`, or is the param genuinely dropped?                                                                            |
| `partial_path` (`renderer/abstract-renderer.ts`)      | `(object, view)`                     | `(object, view, contextPrefix)` | Extra `contextPrefix`. Is this present in Rails 8.0.2's `partial_path`, or a port addition that should be internal state?                                                                     |
| `process_controller_response` (`test-case.ts`)        | `(action, cookies, xhr)`             | `(action, _xhr)`                | Test helper drops `cookies`. Does the port set cookies via another path?                                                                                                                      |

## Acceptance criteria

- [ ] Each of the four candidates has a written verdict (genuine / convention)
      backed by a Rails-source line reference and a TS-source line reference.
- [ ] Every candidate confirmed **genuine** is fixed to match Rails' signature and
      behavior, with a test mirroring the corresponding Rails test (read it first;
      never invent or reword a test name).
- [ ] Every candidate reclassified as **convention noise** is moved to the s3
      ledger with its bucket and justification — not "fixed" by changing arity.
- [ ] No anti-fidelity rewrite: no application code is changed solely to make an
      advisory arity count drop.
- [ ] `pnpm api:compare --arity` delta recorded in the PR body; `test:compare`
      green; touched suites green.

## Notes

- Rails sources: `vendor/rails/activerecord/lib/active_record/associations/association_scope.rb:112`;
  `vendor/rails/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb`;
  `vendor/rails/actionview/lib/action_view/renderer/abstract_renderer.rb`;
  `vendor/rails/actionpack/lib/action_controller/test_case.rb`.
- This story is bounded by what the sources show. If all four are convention
  noise, this story is a no-op beyond documentation — fold its content into s3 and
  close it. That is an acceptable outcome (RFC §Open questions 2).
- These span three packages (activerecord, actiondispatch, actionview) plus the
  controller test harness. If the genuine fixes don't fit one ≤500-LOC PR with
  non-overlapping files, split per package into sibling stories
  (`pnpm tasks new …`) — do not stack PRs or fan out unscoped.
