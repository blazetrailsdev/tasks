---
title: "converge-extended-deterministic-queries-core-queries-include"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: trails#8034
claim: "2026-09-24T13:40:32Z"
assignee: "adapter-class-sync-retires-with-eager-adapter-resolution"
blocked-by: null
closed-reason: null
---

## Context

Left over from `converge-module-include-permanent-call-receipts`.
`packages/activerecord/src/encryption/extended-deterministic-queries.ts`
`ExtendedDeterministicQueries.installSupport` still carries
`@missingRailsCall include — PERMANENT`. Rails
(`activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:24`)
runs `ActiveRecord::Base.include(CoreQueries)`, where `CoreQueries` is an
`ActiveSupport::Concern` whose `class_methods` `find_by(*args)` calls `super`
(`extended_deterministic_queries.rb:~130`).

In trails `Base.findBy` comes from `extend(Base, { find, findBy, findByBang })`
(`base.ts:2675`, Core's ClassMethods). ruby-compat's `extend()` copies statics
onto the class, so there is no chain below it: a Concern `include(Base, CoreQueries)`
whose `ClassMethods.findBy` calls super has nothing to reach. That is why the
body still wraps `Base.findBy` with the activesupport `prepend(target, {findBy(super_, ...)})`.

## Acceptance criteria

- `CoreQueries` is a Concern with `ClassMethods.findBy` calling the next `findBy`
  (a live singleton-side ancestry for `extend()`, or equivalent), and
  `installSupport` makes the `include(Base, CoreQueries)` call.
- The `@missingRailsCall include — PERMANENT` receipt on `installSupport` is deleted.
