---
title: "canUseFastCacheVersion should check default_timezone == utc (integration.rb:184)"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3638
claim: "2026-06-19T13:12:26Z"
assignee: "cache-version-fast-path-utc-timezone-guard"
blocked-by: null
---

## Context

Rails `can_use_fast_cache_version?`
(`vendor/rails/activerecord/lib/active_record/integration.rb:178-186`) guards the
fast path with `self.class.with_connection(&:default_timezone) == :utc` — if the
connection's default_timezone is not UTC, the raw DB string can't be reused
verbatim as a cache version. Rails itself flags this with a FIXME: "checking out
a connection for this is wasteful, we should store/cache this information in the
schema cache or similar."

trails `canUseFastCacheVersion`
(`packages/activerecord/src/integration.ts`) OMITS this guard because reading
default_timezone currently needs an async connection call that can't be made from
the synchronous `cacheVersion` path. The `TIMESTAMP_RE` shape check is documented
as a partial proxy. This is safe today (trails default_timezone is UTC for the
covered adapters) but is a tracked deviation surfaced by story
cache-version-fast-path-raw-timestamp (PR #3633).

## Acceptance criteria

- [ ] Expose default_timezone synchronously (e.g. cached on the model/schema
      cache, per Rails' own FIXME) so it can be read without an async connection
      checkout.
- [ ] Add `defaultTimezone === "utc"` to `canUseFastCacheVersion`, matching
      integration.rb:184; a non-UTC connection falls through to the type-casting
      reader.
- [ ] Test: with default_timezone set to local, the fast path is NOT taken for a
      DB-sourced raw timestamp (reader is called).

## Definition of done

`canUseFastCacheVersion` checks `defaultTimezone === "utc"` synchronously,
matching Rails' `can_use_fast_cache_version?` guard set in full.
