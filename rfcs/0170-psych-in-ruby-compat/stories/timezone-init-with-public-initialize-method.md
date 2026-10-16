---
title: "TimeZone/TimeWithZone init_with go through an invented public initialize method"
status: done
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8958
claim: "2026-10-15T22:14:49Z"
assignee: "psych-yaml-tree-answers-a-node-tree-emitted-by-node-yaml"
blocked-by: null
closed-reason: null
---

## Context

trails#8938 ported `ActiveSupport::TimeZone#init_with`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/values/time_zone.rb:575-577`,
`initialize(coder["name"])`). Psych's `ToRuby#revive` revives an _allocated_
object (`packages/ruby-compat/src/psych/visitors/to-ruby.ts` `allocate`, then
`initWith`), and the trails `TimeZone` constructor
(`packages/activesupport/src/values/time-zone.ts`) is a factory: a bare `new`
answers the cached zone through the module-level `creating` flag. So the PR
extracted a public `TimeZone#initialize(name, utcOffset, tzinfo)` that both the
constructor and `initWith` call, and receipted it `@noRailsEquivalent PERMANENT`.
It also dropped `readonly` from `name` / `tzinfo` / `_utcOffset`. The reviewer
flagged that the root CLAUDE.md says trails has no `initialize` methods, and
that no owner ruling covers this, so the receipt should be `CONVERGEABLE`.
`TimeWithZone#initialize` (`packages/activesupport/src/time-with-zone.ts`) is
the same shape.

## Acceptance criteria

- [ ] Either get a repo-owner ruling that an `init_with` revived from an
      allocation may call a split-out `initialize` (then record it in
      CLAUDE.md and keep `PERMANENT`), or converge: revive TimeZone /
      TimeWithZone without a public `initialize`, e.g. an alloc func
      (`rbDefineAllocFunc`) that runs the constructor body, and delete the
      method and its receipt.
- [ ] `time with zone` YAML tests (`to yaml`, `ruby to yaml`, `yaml load`,
      `ruby yaml load`) stay green.
