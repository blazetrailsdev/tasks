---
title: "converge-base-configurations-onto-the-rails-accessor"
status: claimed
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-27T00:38:56Z"
assignee: "converge-base-configurations-onto-the-rails-accessor"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Base.configurations` is a real reader/writer pair in Rails
(`vendor/rails/activerecord/lib/active_record/core.rb`, `self.configurations`
/ `self.configurations=`, always returning a `DatabaseConfigurations`).

trails ported the reader as `Core.configurations(config?)`
(`packages/activerecord/src/core.ts:432`) but never wired it onto `Base`: every
producer and consumer treats `configurations` as a plain static property
(`(klass as any).configurations = {...}` in `connection-handling.ts:966`,
`:1143`, `shard-keys.test.ts`, `connection-handling.test.ts`, and the
`configurationsEmpty` helper in `query-cache.ts`), so the raw value can be a
`DatabaseConfigurations`, a raw hash, an array, or `undefined`.

Fallout: `query_cache.rb`'s `connected? || !configurations.empty?` guard cannot
be ported as a call. PR #5377 converged every other call in
`QueryCache::ClassMethods#cache`/`#uncached` but had to leave two
`configurations` entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/{base,query-cache}.json`
with a bucket-(b) reason.

## Acceptance criteria

- `Base.configurations` reads and writes through the Rails-named accessor,
  normalizing to a `DatabaseConfigurations` as Rails does, with the setter
  spelled per the repo's Ruby→TS conventions.
- All in-tree producers/consumers (including tests) go through it; the
  `configurationsEmpty` helper in `query-cache.ts` collapses into
  `this.configurations().empty` (or the converged spelling).
- The four `cache`/`uncached` → `configurations` entries drop out of the wide
  call-mismatch baseline; `pnpm api:calls:wide` passes with a strictly smaller
  baseline.
- Tests named verbatim after the Rails cases that cover
  `Base.configurations` (`vendor/rails/activerecord/test/cases/`).
