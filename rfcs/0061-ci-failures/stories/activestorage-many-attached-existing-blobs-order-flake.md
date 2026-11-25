---
title: "Fix order flake in ManyAttachedTest existing-blobs test on PostgreSQL"
status: claimed
updated: 2026-11-25
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-25T13:59:45Z"
assignee: "activestorage-many-attached-existing-blobs-order-flake"
blocked-by: null
closed-reason: null
---

## Context

CI run 44178173797 (trails#10272), job "Active Record PostgreSQL Tests (2)":
`packages/activestorage/test/models/attached/many.test.ts:634` got `town.jpg` where it expected `funky.jpg`.

Rails' test (`vendor/rails/v8.0.2/activestorage/test/models/attached/many_test.rb:481-485`) reads `user.reload.highlights.first` / `.second` with no ORDER BY. It depends on the attachments being inserted in assignment order, so `id` order and heap order agree. If trails writes the two `active_storage_attachments` rows concurrently (for example a `Promise.all` in the attach/save path), the ids can come out reversed, and PostgreSQL returns them in the wrong order.

## Acceptance criteria

- Find out whether the attachment rows are inserted in assignment order. If they are not, make the inserts sequential, as Rails does.
- The test passes repeatedly on PostgreSQL with no change to the test.
