---
title: "File.join takes a to_path component; port LoadAllFixturesWithPathnameTest"
status: draft
updated: 2026-10-11
rfc: "0154-ruby-compat-surfaced-deviations"
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

`LoadAllFixturesWithPathnameTest#test_all_there`
(`vendor/rails/v8.0.2/activerecord/test/cases/fixtures_test.rb:1263-1273`) sets
`fixture_paths = [Pathname.new(FIXTURES_ROOT).join("all")]` and calls
`fixtures :all`. It is the one `LoadAllFixtures*` case still excluded in
`scripts/parity/unported-files/unscoped.ts:134`; the String and Array variants
are live in `packages/activerecord/src/fixtures.test.ts`.

The `Pathname` half has landed: `Pathname#join`, `#+` (`plusOp`) and
`#absolute?` are ported (`packages/ruby-compat/src/pathname.ts:155-224`,
trails#8937; `vendor/ruby/v3.3.11/ext/pathname/lib/pathname.rb:233,356-427`).

What remains is `File.join`. `TestFixtures::ClassMethods#fixtures` calls
`::File.join(path, "{**,*}/*.{yml}")`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:57-71`)
with the `Pathname` from `fixture_paths`. MRI's `rb_file_join`
(`vendor/ruby/v3.3.11/file.c:5013`) converts each component with
`rb_get_path`, so anything answering `to_path` joins. ruby-compat's
`File.join` takes `FileJoinArg = string | readonly FileJoinArg[]`
(`packages/ruby-compat/src/file.ts:67`) and has no `toPath` arm.

## Acceptance criteria

- [ ] `File.join` accepts a component answering `toPath` (MRI `rb_get_path`),
      with a `.trails.test.ts` case joining a `Pathname`.
- [ ] `LoadAllFixturesWithPathnameTest` "all there" is ported in
      `fixtures.test.ts` with Rails' body, and its `unscoped.ts` entry deleted.
