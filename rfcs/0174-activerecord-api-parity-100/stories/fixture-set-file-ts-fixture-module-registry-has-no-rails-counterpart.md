---
title: "activerecord: FixtureSet::File's TS fixture-module registry has no Rails counterpart"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-subsystems-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`FixtureSet::File` reads one YAML file
(`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/file.rb:51-59`):

```ruby
def raw_rows
  @raw_rows ||= begin
    data = ActiveSupport::ConfigurationFile.parse(@file, context:
      ActiveRecord::FixtureSet::RenderContext.create_subclass.new.get_binding)
    data ? validate(data).to_a : []
  rescue RuntimeError => error
    raise Fixture::FormatError, error.message
  end
end
```

`packages/activerecord/src/fixture-set/file.ts` adds a module-level `fixtureModules` map and two
statics Rails has no counterpart for, both `@noRailsEquivalent`:

- `File.registerModule(file, rows)` stores a TS object under a pretend `.ts` path, and `rawRows` takes
  an invented first arm that answers from the map instead of calling `ConfigurationFile.parse`.
- `File.modules()` lists the registered paths. `FixtureSet#readFixtureFiles`
  (`packages/activerecord/src/fixtures.ts`) appends them to the `Dir.glob` Rails writes
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/fixtures.rb:781-797`), and
  `packages/activerecord/src/test-fixtures.ts` does the same for `fixtures :all`.

The registry is how the canonical fixture data in `packages/activerecord/src/test-helpers/fixtures/*.ts`
reaches `FixtureSet` (`test-helpers/fixtures-registry.ts`), and about a dozen test files register
ad-hoc rows through it. RFC `0170-psych-in-ruby-compat` leans on it as the YAML-free fixture format.
No CLAUDE.md section ratifies a second fixture format, so it is debt with an owner, not a settled shape.

## Acceptance criteria

- [ ] `File#rawRows` has one arm, `ConfigurationFile.parse(this.file, { context })`, as `fixture_set/file.rb:51-59` does; `fixtureModules`, `File.registerModule` and `File.modules` are deleted.
- [ ] `FixtureSet#readFixtureFiles` globs `.yml` only (`fixtures.rb:782-784`), and `fixtures :all` in `test-fixtures.ts` likewise.
- [ ] Fixture data reaches `File` through a file `ConfigurationFile.parse` reads. If the story finds that cannot hold (the optional-`yaml` constraint of RFC 0170), it is blocked with that specific blocker, not re-tagged `PERMANENT`.
- [ ] `pnpm parity:api:extra:gate` stays rowless and `pnpm parity:fixtures` does not regress.

## Verification

```bash
pnpm vitest run packages/activerecord/src/fixtures.test.ts packages/activerecord/src/test-fixtures.test.ts && pnpm parity:api:extra:gate && pnpm parity:fixtures
```
