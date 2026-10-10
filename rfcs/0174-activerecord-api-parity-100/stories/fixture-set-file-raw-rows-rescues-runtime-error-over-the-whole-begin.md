---
title: "activerecord: FixtureSet::File#raw_rows rescues RuntimeError over the whole begin, not ConfigurationFile::FormatError around parse"
status: done
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8733
claim: "2026-10-09T22:39:42Z"
assignee: "relation-load-path-and-references-to-s-invented-arms"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::FixtureSet::File#raw_rows`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/file.rb:50-58`) is

```ruby
@raw_rows ||= begin
  data = ActiveSupport::ConfigurationFile.parse(@file, context: ...)
  data ? validate(data).to_a : []
rescue RuntimeError => error
  raise Fixture::FormatError, error.message
end
```

Two things differ in `packages/activerecord/src/fixture-set/file.ts` (`rawRows`):

- **The rescued class.** trails catches `ConfigurationFile.FormatError` only and rethrows anything
  else. Rails rescues `RuntimeError`. `ActiveSupport::ConfigurationFile::FormatError` is
  `< StandardError` (`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:10`),
  not a `RuntimeError`, so Rails does not convert it, and does convert a bare `raise "..."` from the
  rendered template, which trails lets through.
- **The rescue's extent.** Rails' `begin` covers `validate(data).to_a` as well; trails' `try` covers
  only the `parse` call.

Seen while receipting the `.ts`-module arm on trails#8716; that arm is ratified
(`packages/activerecord/CLAUDE.md` § "Fixtures load from `.ts` modules as well as YAML") and is not
part of this story.

## Acceptance criteria

- [ ] `rawRows` rescues ruby-compat's `RuntimeError` (and only that), over the same statements
      Rails' `begin` covers, and raises `Fixture::FormatError` with `error.message`.
- [ ] A test pins both directions: a `RuntimeError` from the template becomes `FormatError`, a
      `ConfigurationFile.FormatError` propagates unchanged — after checking each against
      `vendor/rails/v8.0.2/activerecord/test/cases/fixture_set/file_test.rb`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:throws` stay green.
