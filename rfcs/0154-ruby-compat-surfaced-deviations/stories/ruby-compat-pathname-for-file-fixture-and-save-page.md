---
title: "file_fixture and save_page return a Pathname (dirname, mkpath, exist?)"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ruby-compat now has a `Pathname` (`packages/ruby-compat/src/pathname.ts`:
`new`, `==`, `to_s`, `to_path`, `open`, `cleanpath`, `absolute?`, `+`, `join`,
`relative_path_from`), but two Rails callers that return a `Pathname` are still
ported as Strings, and the members they reach (`dirname`, `mkpath`, `exist?`)
are not ported:

- `ActiveSupport::Testing::FileFixtures#file_fixture`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/file_fixtures.rb:26-33`)
  is `Pathname.new(File.join(file_fixture_path, fixture_name))` followed by
  `path.exist?`. trails (`packages/activesupport/src/testing/file-fixtures.ts:16-19`)
  returns `File.join(...)` and checks `File.isExist`.
  `activesupport/test/testing/file_fixtures_test.rb:10-13,26-29` asserts
  `assert_kind_of Pathname, path`, which the port can only check as a string.
- `ActionDispatch::TestHelpers::PageDumpHelper#save_page`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/test_helpers/page_dump_helper.rb:15-21`)
  does `path = Pathname.new(path); path.dirname.mkpath` and returns the
  Pathname. trails (`packages/actionpack/src/action-dispatch/testing/test-helpers/page-dump-helper.ts`)
  uses `FileUtils.mkdirP(File.dirname(path))` and returns a string.

## Acceptance criteria

- [ ] ruby-compat ports `Pathname#dirname`, `#mkpath` and `#exist?`
      (`vendor/ruby/v3.3.11/ext/pathname/`), each cited and receipted.
- [ ] `file_fixture` and `save_page` build and return a `Pathname` as Rails does.
- [ ] `file-fixtures.test.ts` asserts the `Pathname` kind, as
      `file_fixtures_test.rb` does.
