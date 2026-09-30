---
title: "ruby-compat-pathname-for-file-fixture-and-save-page"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

ruby-compat has no `Pathname`, so callers that Rails writes against `Pathname.new(...)` answer Strings:

- `ActiveSupport::Testing::FileFixtures#file_fixture` (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/file_fixtures.rb:26-33`) is `Pathname.new(File.join(file_fixture_path, fixture_name))` followed by `path.exist?`. trails: `packages/activesupport/src/testing/file-fixtures.ts` returns `File.join(...)` and checks `File.isExist`. `activesupport/test/testing/file_fixtures_test.rb:10-13,26-29` asserts `assert_kind_of Pathname, path`, which the trails port (`packages/activesupport/src/testing/file-fixtures.test.ts`) can only check as `typeof "string"`.
- `ActionDispatch::TestHelpers::PageDumpHelper#save_page` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/test_helpers/page_dump_helper.rb:15-21`) does `path = Pathname.new(path); path.dirname.mkpath` and returns the Pathname, which `save_and_open_page` passes on. trails: `packages/actionpack/src/action-dispatch/testing/test-helpers/page-dump-helper.ts` uses `FileUtils.mkdirP(File.dirname(path))` and returns a string.
- `Engine::Configuration#root=` has the same gap (`converge-engine-configuration-root-pathname-new`).

Surfaced in trails#8293 review.

## Acceptance criteria

- [ ] ruby-compat ports the `Pathname` members these callers reach (`new`, `join`, `dirname`, `mkpath`, `exist?`, `to_s`), mirroring `vendor/ruby/v3.3.11/ext/pathname/`.
- [ ] `file_fixture` and `save_page` return a `Pathname` as Rails does.
- [ ] `file-fixtures.test.ts` asserts `Pathname` kind, as `file_fixtures_test.rb` does.
