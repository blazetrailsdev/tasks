---
title: "TimeZone/TimeWithZone init_with copies a constructed instance onto the receiver (Object.assign)"
status: claimed
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-16T03:14:51Z"
assignee: "port-system-testing-browser-onto-playwright-launch-options"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TimeZone#init_with` (`vendor/rails/v8.0.2/activesupport/lib/active_support/values/time_zone.rb:575-577`) is `initialize(coder["name"])`. `TimeWithZone#init_with` (`time_with_zone.rb`) and `#marshal_load` likewise call `initialize` on the allocated receiver.

trails#8958 removed the invented public `initialize` methods. `packages/activesupport/src/values/time-zone.ts` `initWith` is now `Object.assign(this, TimeZone.create(name))`, and `packages/activesupport/src/time-with-zone.ts` `initWith`/`marshalLoad` are `Object.assign(this, new TimeWithZone(...))`. A JS constructor cannot run on an existing object, so this copy is the closest shape. No repo-owner ruling covers it, and it carries no receipt.

## Acceptance criteria

- [ ] Either get a repo-owner ruling that an `init_with` / `marshal_load` revived from an allocation writes Ruby's `initialize` as copying a constructed instance onto the receiver (record it in CLAUDE.md and receipt both sites `@inventedArm assign — PERMANENT`), or converge: Psych's `revive` constructs through an `rbDefineAllocFunc` that knows the coder, so no copy is needed.
- [ ] The `time with zone` YAML and marshal tests stay green.
