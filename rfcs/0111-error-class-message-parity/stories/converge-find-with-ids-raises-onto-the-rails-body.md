---
title: "converge-find-with-ids-raises-onto-the-rails-body"
status: draft
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
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

`pnpm parity:api:arms:throws` still carries one row for
`activerecord/relation/finder-methods.ts#findWithIds`
(`-throw -if -if -if -if -throw -if -if`). Rails' body
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:491-518`)
raises `UnknownPrimaryKey.new(model)` when `primary_key.nil?` (`:492`) and
raises `RecordNotFound.new("Couldn't find #{model_name} without an ID", model_name, primary_key)`
in its `case ids.size when 0` arm (`:508-511`). The trails port delegates both
shaping and the second raise to `normalizeFindArgs`
(`packages/activerecord/src/relation/finder-methods.ts:33`, tagged
`@noRailsEquivalent CONVERGEABLE inline-ruby-bodies-extracted-as-named-helpers`)
and never raises `UnknownPrimaryKey` at all.

The consequence is visible in Rails' `test_find_without_primary_key`
(`vendor/rails/activerecord/test/cases/finder_test.rb:1748-1752`,
`Matey.find(1)` must raise `UnknownPrimaryKey`). Trails' port of it
(`packages/activerecord/src/finder.test.ts`, "find without primary key") asserts
something unrelated (`Post.all().toSql()` contains SELECT), and the Matey model
(`packages/activerecord/src/test-helpers/models/matey.ts`) hard-codes
`static _primaryKey = ""`, which Rails' `test/models/matey.rb` does not; removing
it lets the schema reflect `nil` and the Rails test passes once the raise exists.

This was worked in the burn-the-missing-throw-arms bundle and dropped for the
PR LOC ceiling: inlining Rails' body deletes `normalizeFindArgs`,
`NormalizedFindIds`, and ~215 lines of `finder-methods.trails.test.ts` that only
exercise the invented helper. Note Rails does not flatten nested id arrays
(`ids.compact.uniq`, `:504`) and `find(1, 1)` returns a single record via
`find_one` (not `[record]`), both of which the helper diverges on.

## Acceptance criteria

- [ ] `findWithIds` mirrors `finder_methods.rb:491-518` line for line: the
      `UnknownPrimaryKey` guard, `expects_array`, the empty-array early return,
      `compact.uniq`, and the `case ids.size` switch with the `RecordNotFound`
      raise inline.
- [ ] `normalizeFindArgs` / `NormalizedFindIds` are deleted with their trails tests.
- [ ] `Matey` drops the invented `_primaryKey = ""` and "find without primary key"
      asserts Rails' `UnknownPrimaryKey`.
- [ ] `pnpm parity:api:arms:throws` green; retire the finder-methods row with
      `pnpm parity:api:arms:throws:tighten`. Keep `first`/`last`'s parameter named
      `limit` (`parity:api:params` flags `n` once this file's body changes).
