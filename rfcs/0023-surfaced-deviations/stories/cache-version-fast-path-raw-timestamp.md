---
title: "cacheVersion fast path for raw DB timestamps (can_use_fast_cache_version? parity)"
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3633
claim: "2026-06-19T11:36:27Z"
assignee: "cache-version-fast-path-raw-timestamp"
blocked-by: null
---

## Context

Rails `cache_version` (`vendor/rails/activerecord/lib/active_record/integration.rb:97-115`)
has a fast path: when `updated_at` comes straight from the DB as a raw string,
`can_use_fast_cache_version?(timestamp)` is true and
`raw_timestamp_to_cache_version(timestamp)` formats it WITHOUT invoking the
`updated_at` type-casting reader. Only when the value was user-assigned (Time/
String/Hash) does it fall back to calling `updated_at`.

trails `cacheVersion` (`packages/activerecord/src/integration.ts:138-156`) always
reads `updated_at` via the attribute reader — there is no fast path. Surfaced
in PR #3569 (cache-key.test.ts): Rails' `cache_key_test.rb` distinguishes
"does NOT call updated_at when value is from the database" from "calls updated_at
when generated at create time" / "...assigned via a Time/String/Hash" purely via
`assert_called`/`assert_not_called` mocks. Without the fast path, trails cannot
observe that distinction, so the ported tests assert equivalent behavior.

## Acceptance criteria

- [ ] Implement `can_use_fast_cache_version?` + `raw_timestamp_to_cache_version`
      equivalents so DB-sourced raw timestamp strings bypass the `updated_at`
      reader (integration.rb:97-115 + the private helpers).
- [ ] The four `cache_version does (NOT) call updated_at ...` tests can assert
      the call/no-call distinction faithfully (e.g. via a spy on the reader).

## Definition of done

`cacheVersion` uses the Rails fast path for DB-sourced timestamps and only calls
the `updated_at` reader for user-assigned values.
