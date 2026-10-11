---
title: "ruby-compat: Pathname#join and File.join over a to_path component, for LoadAllFixturesWithPathnameTest"
status: draft
updated: 2026-10-11
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LoadAllFixturesWithPathnameTest#test_all_there`
(`vendor/rails/v8.0.2/activerecord/test/cases/fixtures_test.rb:1263-1273`) sets
`fixture_paths = [Pathname.new(FIXTURES_ROOT).join("all")]` and calls `fixtures :all`.
It is the one `LoadAllFixtures*` case left excluded in
`scripts/parity/unported-files/unscoped.ts`; the String and Array variants are live in
`packages/activerecord/src/fixtures.test.ts`.

Two ruby-compat gaps keep it out:

- `Pathname` (`packages/ruby-compat/src/pathname.ts`) has only `initialize`, `==`, `to_s`
  and `to_path`. `Pathname#join` (`vendor/ruby/v3.3.11/ext/pathname/lib/pathname.rb:416-427`)
  needs `Pathname#+` / `plus` (`:356-398`) and `absolute?` (`:233`).
- `File.join` (`packages/ruby-compat/src/file.ts`, `rb_file_join`,
  `vendor/ruby/v3.3.11/file.c:5013`) takes `string | array` only. MRI converts each
  component with `rb_get_path`, so a `Pathname` (anything answering `to_path`) joins.
  `TestFixtures::ClassMethods#fixtures` calls `::File.join(path, "{**,*}/*.{yml}")`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:57-71`), which is
  where the `Pathname` arrives; trails' port is `packages/activerecord/src/test-fixtures.ts:70-107`.

## Acceptance criteria

- [ ] `Pathname#join`, `#+` and `#absolute?` ported with their MRI citations.
- [ ] `File.join` accepts a component answering `toPath`.
- [ ] `LoadAllFixturesWithPathnameTest` "all there" ported in `fixtures.test.ts` with Rails'
      body, and its `unscoped.ts` entry deleted.
