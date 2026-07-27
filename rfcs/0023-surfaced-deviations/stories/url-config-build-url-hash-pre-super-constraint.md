---
title: "UrlConfig#build_url_hash cannot read the receiver: it runs before super()"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`database_configurations/url_config.rb:69` reads `@url` off the receiver:

```ruby
def build_url_hash
  if url.nil? || url.start_with?("jdbc:", "http:", "https:")
    { url: url }
  else
    ConnectionUrlResolver.new(url).to_hash
  end
end
```

In trails (`packages/activerecord/src/database-configurations/url-config.ts:90`)
this is a module-scope function taking `url`, because its result is merged into
the configuration hash handed to `super(...)` in the `UrlConfig` constructor —
`this` is not available before `super`, so the receiver cannot be read.

Excluded in `scripts/api-compare/arity-exclude.json` (see PR #5340). Resolving it
means restructuring `UrlConfig`/`HashConfig` construction (e.g. a static factory
or deferring the merge past `super`), which is why it was not folded into the
arity pass.

## Acceptance criteria

- `buildUrlHash` reads the receiver's url and takes no parameter, or the
  deviation is re-justified in the story and the exclude reason updated to point
  at this story's conclusion.
- `UrlConfig` construction semantics are unchanged: existing
  `url-config.test.ts` and `connection-url-resolver.test.ts` pass untouched.
- If converged, the entry is removed from `arity-exclude.json`.
