---
title: "Honor @noRailsEquivalent on class declarations (blocks retiring the allow JSON)"
status: claimed
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-07-27T21:41:00Z"
assignee: "no-rails-equivalent-tag-on-class-declarations"
blocked-by: null
closed-reason: null
---

## Context

Found in #5343 (`extra-surface-schema-cache-and-pool-sync-api`,
2026-07-26), the first PR to carry new extra-surface reasons as
`@noRailsEquivalent` tags rather than `extra-surface-allow.json` entries.

19 of that PR's 20 reasons migrated to tags. The twentieth, `NullConfig`
in `connection-adapters/abstract/connection-pool.ts`, could not: the extra
name is a **class declaration**, and `noRailsEquivalentReason`
(`scripts/api-compare/extract-ts-api.ts:1273`) is only called from member,
statement and property emit sites — there is no class-declaration call
site. The tag was written on the class and silently had no effect
(`api:extra` still reported 1 novel) until the entry was restored to the
JSON.

This blocks [[retire-extra-surface-allow-json]]: the JSON cannot be
retired while any justified extra is a class declaration, since there is
no inline form for it.

`NullConfig` is a fair test case. Rails nests `class NullConfig` inside
`NullPool` (`connection_pool.rb:14-22`) and the Ruby extractor records
only the outer class; TS cannot nest a class declaration, so trails
exports it as a sibling and re-attaches it as `NullPool.NullConfig`.

## Acceptance criteria

- Read `@noRailsEquivalent` on class (and interface/type-alias, if they can
  surface as extras) declarations, emitting the reason the same way member
  emit sites do.
- Verify against the live case: tag `NullConfig` in
  `connection-adapters/abstract/connection-pool.ts`, drop its
  `extra-surface-allow.json` entry, and confirm
  `pnpm api:extra --package activerecord` still reports that file at
  0 novel with the tag counted and not stale.
- Audit the remaining `extra-surface-allow.json` entries for other
  declaration kinds with no inline form, so
  [[retire-extra-surface-allow-json]] knows its full blocker set.
- Extend the empty-reason guard (`@noRailsEquivalent needs a reason`) to
  the new emit sites.
