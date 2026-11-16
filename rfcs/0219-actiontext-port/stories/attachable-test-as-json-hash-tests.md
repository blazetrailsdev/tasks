---
title: "Port attachable_test.rb's two as_json-is-a-hash tests"
status: draft
updated: 2026-11-16
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actiontext/test/unit/attachable_test.rb:6-42` has two tests that are still
`it.skip` stubs in `packages/actiontext/test/unit/attachable.test.ts`: "as_json is a hash when the
attachable is persisted" (uses `freeze_time` and `ActiveStorage::Blob.create_after_unfurling!`) and
"as_json is a hash when the attachable is a new record" (`Blob.build_after_unfurling`). trails#10171
ported the third test in that file using `createAfterUnfurlingBang`.

## Acceptance criteria

- Both tests are ported with Rails' names and assertions, comparing the whole `as_json` hash, `attachable_sgid` included.
- A Blob API they need that is missing (`buildAfterUnfurling`) is ported or filed as its own story.
