---
title: "assertion-response-symbol-keeps-colon"
status: draft
updated: 2026-10-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::AssertionResponse#initialize` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertion_response.rb:22-33`) branches on `code_or_name.is_a?(Symbol)`. trails (`packages/actionpack/src/action-dispatch/testing/assertion-response.ts`) tells the arms apart with a regex: a string that does not start with a digit counts as a Symbol. CLAUDE.md ("A Ruby Symbol is a JS string") says a Symbol whose type drives control flow keeps its leading colon (`":success"`).

## Acceptance criteria

- `AssertionResponse` and `assertResponse` (`testing/assertions/response.ts`) take `":success"` / `":not_found"`, and the Symbol arm is `codeOrName.startsWith(":")`.
- Every caller of `assertResponse` and `assertRedirectedTo`'s status in the repo is updated.
