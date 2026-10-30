---
title: "Port attached/many_test.rb"
status: in-progress
updated: 2026-10-30
rfc: "0209-activestorage-port"
cluster: as-attached
packages: ["activestorage"]
deps: ["activestorage-attached-many", "activestorage-test-helper-and-fixture-set"]
deps-rfc: []
est-loc: 650
priority: null
pr: trails#9506
claim: "2026-10-30T19:37:15Z"
assignee: "activestorage-attached-many-test"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/models/attached/many_test.rb` has 75 tests, the `has_many_attached`
twin of `one_test.rb`.

## Acceptance criteria

- All 75 tests are ported with Rails' names; any that does not fit one PR is
  filed as a remainder story with the line range it leaves.
- Rails' `@user.avatar = file` is `await user.setAvatar(file)` (and `photos=`
  is `setPhotos`), and `create!` / `update` with an attachment key go through
  the awaitable path; no test needs a receipt for the writer's timing.
