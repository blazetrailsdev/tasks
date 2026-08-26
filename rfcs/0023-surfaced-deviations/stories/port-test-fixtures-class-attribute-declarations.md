---
title: "Port test_fixtures.rb's eight class_attribute declarations"
status: ready
updated: 2026-08-26
rfc: "0023-surfaced-deviations"
cluster: null
packages: ["activerecord"]
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

`packages/activerecord/src/test-fixtures.ts` declares itself the port of
`activerecord/lib/active_record/test_fixtures.rb` — its header names the Rails
file and the `module TestFixtures` (`:6`), `use_transactional_tests` (`:34`)
and `fixtures` (`:56`) members it mirrors. It is library code, not test
support, which is why it sits at the package root.

But the `included do` block at `test_fixtures.rb:30-37` declares eight
`class_attribute`s that trails has none of:

```ruby
class_attribute :fixture_paths, instance_writer: false, default: []
class_attribute :fixture_table_names, default: []
class_attribute :fixture_class_names, default: {}
class_attribute :use_transactional_tests, default: true
class_attribute :use_instantiated_fixtures, default: false
class_attribute :pre_loaded_fixtures, default: false
class_attribute :lock_threads, default: true
class_attribute :fixture_sets, default: {}
```

`test-fixtures.ts` contains zero `classAttribute()` calls. The one name that
does appear, `useTransactionalTests`, is a per-call option destructured off the
`fixtures()` options object (`:569`, `:580`) — a local, not a class-level store
a subclass can read or override. `ActiveSupport.run_load_hooks(:active_record_fixtures, self)`
(`test_fixtures.rb:39`) has no counterpart either.

Split out of `converge-test-fixtures-class-attribute-stores` (0112), which was
closed on a falsified premise: that story assumed trails had duplicated these
stores, and 0112 is scoped to one-Rails-thing-N-trails-things duplication.
Absent surface is a different problem, so it belongs here rather than there.

## Acceptance criteria

- [ ] The eight `class_attribute` declarations exist on the TestFixtures host
      with Rails' names, defaults, and `instance_writer: false` on
      `fixture_paths`, via `classAttribute()` from `@blazetrails/activesupport`
      (per CLAUDE.md: do not hand-roll copy-on-first-write).
- [ ] `useTransactionalTests` reads through the class attribute, with the
      existing per-call `fixtures(..., { useTransactionalTests: false })`
      option still overriding it for that scope — every current call site keeps
      working unchanged.
- [ ] `parity:api` for `test_fixtures.rb` improves; no new `parity:api:extra`
      rows.
- [ ] Decide and record whether `run_load_hooks(:active_record_fixtures)` is in
      scope; if not, say why at the call site rather than leaving it silent.

## Notes

Scope check before starting: several of the eight may have no trails consumer
yet (`lock_threads` has no threading analogue; `pre_loaded_fixtures` and
`use_instantiated_fixtures` gate behaviour trails' DSL may not implement).
Declaring a store nothing reads is still the Rails shape and is the point of
the port, but if a member would be pure dead surface, prefer shipping the ones
with real consumers and filing the remainder with the reason — do not widen an
allowlist to cover them.
