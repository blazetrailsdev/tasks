---
title: "test port system for the Writebook example"
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

- `test/system/book_cover_test.rb`
- `test/system/edit_page_test.rb`
- `test/system/publish_book_test.rb`
- `test/test_helpers/system_test_helper.rb`

## Acceptance criteria

- The three system tests run on trails' Vitest + Playwright system testing (CLAUDE.md, "System testing runs on Vitest") with verbatim names.
