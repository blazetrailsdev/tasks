---
title: "integration.trails.test.ts cites the wrong integration.rb lines for Runner#method_missing"
status: draft
updated: 2026-10-02
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8407 added two trails-only tests to
`packages/actionpack/src/action-dispatch/testing/integration.trails.test.ts`
whose names cite the wrong lines of
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb`:

- "is built by the first name the test misses, which the session then answers
  (integration.rb:424-432)" — `Runner#respond_to_missing?` is `:437-439` and
  `Runner#method_missing` is `:442-450`. `:424-432` is
  `copy_session_variables!` and `default_url_options`.
- "keeps one session class per app across reset! (integration.rb:358-363)" —
  `reset!` is `:358-360` and `create_session` is `:362-372`.

The same `:424-432` citation is in the merged commit message and PR body, which
cannot be changed; the test names can. Both names are trails-only, so
`parity:test` does not match on them.

## Acceptance criteria

- The two test names cite `integration.rb:442-450` and
  `integration.rb:358-372`.
- No other text in the file changes.
