---
title: "Drive the SendFileTest tests through SendFileController (parked branch)"
status: draft
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 480
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`drive-matched-redirect-and-send-file-tests-through-their-rails-controllers`
shipped its redirect half and stopped at the LOC ceiling. The send-file half is
written and green, and is parked on the pushed branch
`send-file-tests-through-send-file-controller` (one commit on `origin/main`,
~480 LOC, no PR). Rebase it and open it.

What that commit does, against
`vendor/rails/v8.0.2/actionpack/test/controller/send_file_test.rb`:

- `packages/actionpack/src/action-controller/controller/send-file.test.ts`:
  `SendFileController` gains the six `test_send_file_headers_*` actions
  (`:31-67`) and `SendFileWithActionControllerLive` (`:77-79`). The 18 tests
  that built an ad-hoc `class C extends Base` and called `c.dispatch` run
  `process` / `get` through `ActionController::TestCase` (`:88-208,261-289`).
  The `fs` / `path` / `os` imports, the temp file and the duplicate
  `describe("SendFileController")` block are deleted.
- `packages/actionpack/src/action-controller/metal/data-streaming.ts`:
  `sendFileHeadersBang` raised `TypeError` and took its Mime lookup arm on any
  `type` without a `/`. Rails raises `ArgumentError` and takes that arm on
  `content_type.is_a?(Symbol)`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/data_streaming.rb:134-146`),
  so a Symbol type is `":png"` and `type: Mime[:png]` is assigned as it is.
- `metal/data-streaming.test.ts` follows: `":json"` / `":nope"`.

## Acceptance criteria

- Every `SendFileTest` test runs through `SendFileController` and
  `ActionController::TestCase`, in Rails order, with Rails' assertions.
- `SendFileController` and `SendFileWithActionControllerLive` carry every Rails
  action.
- `send-file.test.ts` has no `fs` / `path` / `os` import and no temp file.
- `sendFileHeadersBang` raises `ArgumentError` with Rails' two messages.
- `pnpm parity:test:assertions` shows no mismatch for `controller/send_file_test.rb`.
