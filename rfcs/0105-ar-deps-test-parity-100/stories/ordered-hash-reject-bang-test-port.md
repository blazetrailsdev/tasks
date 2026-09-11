---
title: "Port OrderedHashTest#test_reject! verbatim (drop dead h.reject call)"
status: draft
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/ordered-hash.test.ts` "reject!" calls `h.reject(...)`
and discards the result before calling `h.deleteIf(...)`. Rails' `test_reject!`
(`vendor/rails/activesupport/test/ordered_hash_test.rb:137-142`) uses only
`reject!`. The test is not a port of the Rails body. Surfaced in trails#7708's review.

## Acceptance criteria

- Port `test_reject!` line by line from `ordered_hash_test.rb:137-142`,
  including the `reject!` return value and its hash assertions. Delete the dead
  `h.reject` call.
- If `OrderedHash` lacks a `reject!` equivalent, add it following the naming
  conventions doc.
