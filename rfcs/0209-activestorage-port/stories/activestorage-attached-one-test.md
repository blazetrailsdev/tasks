---
title: "Port attached/one_test.rb"
status: draft
updated: 2026-10-28
rfc: "0209-activestorage-port"
cluster: as-attached
packages: ["activestorage"]
deps: ["activestorage-attached-model-and-one", "activestorage-test-helper-and-fixture-set"]
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

`vendor/rails/v8.0.2/activestorage/test/models/attached/one_test.rb` has 86 tests: attaching blobs,
signed ids, uploaded files and hashes, replacing, detaching, purging, dirty
tracking, `with_attached_*`, service selection, and the transaction /
after-commit ordering.

## Acceptance criteria

- All 86 tests are ported with Rails' names; any that does not fit one PR is
  filed as a remainder story with the line range it leaves.
- Tests that depend on variants or previews wait on those stories rather than
  being rewritten.
