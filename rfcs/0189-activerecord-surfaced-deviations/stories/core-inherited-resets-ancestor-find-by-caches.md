---
title: "core-inherited-resets-ancestor-find-by-caches"
status: in-progress
updated: 2026-11-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9995
claim: "2026-11-11T16:19:38Z"
assignee: "core-inherited-resets-ancestor-find-by-caches"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Core::ClassMethods#inherited` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:409-421`) calls `subclass.initialize_find_by_cache` and then, unless the subclass is a base class, walks `klass = self; until klass.base_class?` calling `klass.initialize_find_by_cache` on every ancestor up to the base class. A parent's cached `find` / `find_by` statements bake its type condition (`type IN (...)` over its descendants' sti names), so defining a new STI subclass must drop them.

trails seeds only the subclass's own cache lazily (`cachedFindByStatement`, `packages/activerecord/src/core.ts:705-716`; packages/activerecord/CLAUDE.md § "`inherited` is deferred"). The ancestor reset arm has no port: after `Firm.find(id)` has cached a statement, a later `class FirmOnTheFly extends Firm {}` (registered as a descendant) leaves `Firm.find` running the stale `type IN ('Firm', 'Agency')` statement, while `Firm.where(id:).first` sees the new descendant.

Surfaced porting `inheritance_test.rb:509-536` (`test_instantiation_doesnt_try_to_require_corresponding_file`), whose states 2 and 3 need `Firm.find` to see the new subclass.

## Acceptance criteria

- Defining / registering an STI subclass invalidates the find-by statement cache of each ancestor up to its base class, as `core.rb:414-419` does, via the deferred-`inherited` mechanism (e.g. at descendant registration), not a call-site reset.
- A test: `Firm.find(id)` cached, then a new `Firm` subclass registered, then `Firm.find(id)` uses the new type condition.
