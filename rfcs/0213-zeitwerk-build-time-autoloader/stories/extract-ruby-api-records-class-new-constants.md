---
title: "extract-ruby-api-records-class-new-constants"
status: done
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9668
claim: "2026-11-03T14:11:44Z"
assignee: "extract-ruby-api-records-class-new-constants"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ruby-api.rb` records `class`/`module` declarations and the `%w{…}.each { const_set(name, Class.new(Super)) }` shape (`extract_const_set_classes`), but not a plain constant assignment of an anonymous class, e.g. `Canceled = Class.new(ActiveRecordError)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/future_result.rb:51`). So `ActiveRecord::FutureResult::Canceled` has no `rails-api.json` row, `scripts/api-compare/class-paths.ts` cannot pair `packages/activerecord/src/future-result.ts::Canceled`, and it sits in `constant-residue.json`'s `excluded` list under a `@noRailsEquivalent CONVERGEABLE` receipt pointing here.

## Acceptance criteria

- `extract-ruby-api.rb` records `Name = Class.new(Super)` (and `Class.new(Super) do … end`) as a class nested in the enclosing namespace.
- `future-result.ts::Canceled` pairs to `ActiveRecord::FutureResult::Canceled` (moved to `FutureResult.Canceled` if the walk needs it), its receipt is removed, and it leaves `excluded`.
- Any other package's new rows are reviewed; `pnpm parity:class-paths --check` stays green.
