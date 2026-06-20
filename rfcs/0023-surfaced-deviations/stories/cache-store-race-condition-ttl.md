---
title: "cache-store-race-condition-ttl"
status: claimed
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-20T00:54:21Z"
assignee: "cache-store-race-condition-ttl"
blocked-by: null
---

## Context

`ActiveSupport::Cache::Store#handle_expired_entry` (cache.rb:1031–1045) has a `race_condition_ttl` path: when an entry has expired but is within `race_condition_ttl` seconds of its expiry, the store writes the stale entry back with a bumped TTL equal to `race_condition_ttl`. This lets concurrent readers get the old value while one writer regenerates the new value, preventing cache stampedes.

Current `store.ts` `handleExpiredEntry` (cache/store.ts) unconditionally deletes the entry and returns `null` when expired. The `race_condition_ttl` branch is entirely absent. This means any caller passing `race_condition_ttl:` sees no effect.

Rails implementation:

```ruby
def handle_expired_entry(entry, key, options)
  if entry && entry.expired?
    race_ttl = options[:race_condition_ttl].to_i
    if (race_ttl > 0) && (Time.now.to_f - entry.expires_at.to_f <= race_ttl)
      entry.expires_at = Time.now + race_ttl
      write_entry(key, entry, expires_in: race_ttl)
    else
      delete_entry(key, options)
    end
    entry = nil
  end
  entry
end
```

## Acceptance criteria

- Port `race_condition_ttl` branch to `handleExpiredEntry` in `cache/store.ts`
- When `options.raceConditionTtl > 0` and entry expired within the TTL window, bump its `expiresAt` and write it back with the bumped TTL
- Add a test that verifies stale reads are served within the window and regenerated after
- api:compare delta non-negative; LOC ceiling ≤ 500
