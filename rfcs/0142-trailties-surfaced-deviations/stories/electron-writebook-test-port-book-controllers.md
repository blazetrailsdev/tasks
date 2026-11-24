---
title: "test port book controllers for the Writebook example"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: ["electron-writebook-test-port-fixtures-and-models"]
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

Writebook (vendored at `vendor/writebook/v1.2.9`) ships Minitest tests under `test/`. `examples/electron-writebook` (trails#10716) ports the app but only carries a few invented integration tests. Port each Rails test with its name verbatim (`test "x"` → `it("x")`, file `foo_test.rb` → `foo.test.ts` at the same path under `examples/electron-writebook/test/`), asserting what Rails asserts.

Files:

- `test/controllers/action_text/markdown/uploads_controller_test.rb`
- `test/controllers/active_storage_authentication_test.rb`
- `test/controllers/active_storage_authorization_test.rb`
- `test/controllers/blob_reattachment_test.rb`
- `test/controllers/books/bookmarks_controller_test.rb`
- `test/controllers/books_controller_test.rb`
- `test/controllers/books/leaves/moves_controller_test.rb`
- `test/controllers/books/publications_controller_test.rb`
- `test/controllers/books/searches_controller_test.rb`
- `test/controllers/leafables_controller_test.rb`
- `test/controllers/pages_controller_test.rb`
- `test/controllers/pages/edits_controller_test.rb`
- `test/controllers/pictures_controller_test.rb`
- `test/controllers/sections_controller_test.rb`

## Acceptance criteria

- Each listed test is ported with its verbatim name and passes, or is `it.skip` naming a filed story.
