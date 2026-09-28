---
title: "Port controller/resources_test.rb lines 601-1471 under the Rails test names"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-resources-test-part-1"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The remaining 43 `ResourcesTest` tests in
`vendor/rails/v8.0.2/actionpack/test/controller/resources_test.rb` (Rails lines
601-1167): resources nested in singletons and the reverse, collection-path
verb restrictions, named routes, namespaced and nested-namespace resources,
`path` segments, and the long `only:` / `except:` matrix for resources and
singleton resources — plus the private assertion helpers that follow
(`:1169-1471`) if part 1 did not need them all.

## Acceptance criteria

- Every remaining test is ported under its extractor name with Rails' body.
- `pnpm parity:test --package actioncontroller` reports `resources_test.rb`
  78/78 with 0 extra.
