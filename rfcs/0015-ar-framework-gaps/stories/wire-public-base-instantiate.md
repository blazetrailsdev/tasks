---
title: "Wire public Base.instantiate class method"
status: done
updated: 2026-06-23
rfc: "0015-ar-framework-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: 4019
claim: "2026-06-23T16:22:58Z"
assignee: "wire-public-base-instantiate"
blocked-by: null
---

## Context

During wave10 of the persistence.test.ts canonical burndown (PR #3841), the
`create columns not equal attributes` test had to call `Topic._instantiate(...)`
because the public `Base.instantiate` class method is NOT wired onto `Base`.

- The implementation exists: `instantiate` is exported from
  `packages/activerecord/src/persistence.ts:130` (does `discriminateClassForRecord`
  then `_instantiate`), but no `static instantiate = …` / `Base.instantiate`
  binding exists (confirmed: `Base.instantiate` is `undefined` at runtime).
- Rails: `ActiveRecord::Persistence::ClassMethods#instantiate` is public and used
  directly in tests, e.g. `persistence_test.rb:672`
  (`Topic.instantiate("title" => …, "does_not_exist" => …)`).

## Acceptance criteria

- [ ] `Base.instantiate(attributes, columnTypes?, block?)` is wired as a public
      static method delegating to the existing `instantiate` function in
      persistence.ts (mirror how other class methods are wired in base.ts).
- [ ] Re-converge `create columns not equal attributes` (persistence.test.ts) to
      call the public `Topic.instantiate` instead of `Topic._instantiate`.
- [ ] api:compare reflects `instantiate` as present (it is a real Rails public API).
