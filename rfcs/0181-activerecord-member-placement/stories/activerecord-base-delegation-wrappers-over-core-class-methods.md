---
title: "activerecord: Base still wraps eleven Core class methods instead of carrying them from core.ts"
status: draft
updated: 2026-10-02
rfc: "0181-activerecord-member-placement"
cluster: placement
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails PR 8383, `packages/activerecord/src/base.ts` still reaches eleven
`core.rb` class methods through a hand-written static that only forwards to
the `core.ts` body. The `inlined-from` report does not flag them, because
`core.ts` carries the body, but each is the delegation wrapper CLAUDE.md
§ "Module mixins" rules out:

- `inspectionFilter` (`base.ts:586`) for `core.rb:363`
- `asynchronousQueriesSession` / `asynchronousQueriesTracker` (`base.ts:639,643`) for `core.rb:141,145`
- `currentPreventingWrites` / `currentRole` / `currentShard` (`base.ts:647,651,655`) for `core.rb:196,159,177`
- `arelTable` / `predicateBuilder` (`base.ts:732,738`) for `core.rb:391,395`
- the `connectionHandler` getter and setter (`base.ts:776-781`) for `core.rb:133,137`
- `inspect` (`base.ts:2292`) for `core.rb:375`

PR 8383 settled both shapes. A `ClassMethods` member (`inspection_filter`,
`inspect`, `arel_table`, `predicate_builder`) is a static on the
`Core::ClassMethods` class module in `core.ts`, carried by
`extend(Base, _Core.ClassMethods)`, as `filterAttributes` now is. A
`def self.x` inside `included do` is seated on the base from `Core`'s
`[included]` hook, as `connectionClass` now is, or assigned to the class
(`static isConnectionClass = _Core.isConnectionClass`).

Paths are relative to the `vendor/rails/v8.0.2/activerecord/lib/active_record/`
tree.

## Acceptance criteria

- [ ] None of the eleven statics above has a body in `base.ts`; `Base` keeps at most a `declare static`.
- [ ] The four `ClassMethods` members are statics on `Core::ClassMethods` in `core.ts`; the `included do def self.` members are seated from the `[included]` hook or assigned to the class.
- [ ] `connectionHandler` stays a property with both halves (`core.rb:133-139`).
- [ ] `pnpm parity:api:extra:gate`, `parity:api:calls` and `parity:api:pins` stay green; activerecord stays rowless.
