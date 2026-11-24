---
title: "test port fixtures and models for the Writebook example"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
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

- `test/fixtures/accesses.yml`
- `test/fixtures/accounts.yml`
- `test/fixtures/action_text/markdowns.yml`
- `test/fixtures/active_storage/attachments.yml`
- `test/fixtures/active_storage/blobs.yml`
- `test/fixtures/books.yml`
- `test/fixtures/leaves.yml`
- `test/fixtures/pages.yml`
- `test/fixtures/pictures.yml`
- `test/fixtures/sections.yml`
- `test/fixtures/users.yml`
- `test/test_helpers/session_test_helper.rb`, `test/test_helper.rb` (`fixtures :all`, the `WRITEBOOK_EMBED_PROVIDERS` setup/teardown)
- `test/models/book/accessable_test.rb`
- `test/models/book_test.rb`
- `test/models/embed_provider_test.rb`
- `test/models/first_run_test.rb`
- `test/models/html_scrubber_test.rb`
- `test/models/leaf/editable_test.rb`
- `test/models/leaf/positionable_test.rb`
- `test/models/leaf/searchable_test.rb`
- `test/models/leaf_test.rb`
- `test/models/page_test.rb`
- `test/models/picture_test.rb`
- `test/models/qr_code_link_test.rb`
- `test/models/section_test.rb`
- `test/models/user/role_test.rb`
- `test/models/user_test.rb`

## Acceptance criteria

- Writebook's YAML fixtures load in the example's tests through trails fixtures (ERB in `users.yml` included), and `resetDatabase` / the invented tests that duplicate a ported one are removed.
- All 114 model tests are ported with verbatim names and pass, or are `it.skip` naming a filed story.
