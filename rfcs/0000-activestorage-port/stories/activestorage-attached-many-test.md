---
title: "Port attached/many_test.rb"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-attached
packages: ["activestorage"]
deps: ["activestorage-attached-many", "activestorage-test-helper-and-fixture-set"]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/models/attached/many_test.rb` has 75 tests, the `has_many_attached`
twin of `one_test.rb`.

## Acceptance criteria

- All 75 tests are ported with Rails' names; any that does not fit one PR is
  filed as a remainder story with the line range it leaves.
