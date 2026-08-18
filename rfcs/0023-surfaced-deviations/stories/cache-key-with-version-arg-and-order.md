---
title: "cache-key-with-version-arg-and-order"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: relation.ts:3094 cacheKeyWithVersion takes no argument and evaluates cacheVersion first, returning `${cacheKey()}-${version}` or bare cacheKey(), matching relation.rb:519-525."
---

## Context

`pnpm codegen:score` scores `active_record/relation.rb :: cacheKeyWithVersion`
as divergent; the `conformance-triage-burndown` triage verified it as a real
deviation.

Rails (`vendor/rails/activerecord/lib/active_record/relation.rb:519-525`) takes
no argument and evaluates `cache_version` first:

```ruby
def cache_key_with_version
  if version = cache_version
    "#{cache_key}-#{version}"
  else
    cache_key
  end
end
```

trails (`packages/activerecord/src/relation.ts:6695-6699`) takes a
`timestampColumn` parameter Rails does not have, and inverts the evaluation
order:

```ts
async cacheKeyWithVersion(timestampColumn = "updated_at"): Promise<string> {
  const key = await this.cacheKey(timestampColumn);
  const version = await this.cacheVersion(timestampColumn);
  return version ? `${key}-${version}` : key;
}
```

Both `cacheKey` and `cacheVersion` issue queries, so the order is observable in
`assertQueries`; and the extra parameter is invented surface (`cache_version`
takes no column argument in Rails).

## Acceptance criteria

- `cacheKeyWithVersion` takes no parameter and evaluates `cacheVersion` before
  `cacheKey`, matching Rails' guard-assignment shape.
- Callers passing a timestamp column are updated (or shown to be none).
- The `…relation.rb::cacheKeyWithVersion::divergent` baseline row is deleted.
