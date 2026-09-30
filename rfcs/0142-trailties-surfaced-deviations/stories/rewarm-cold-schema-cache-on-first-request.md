---
title: "Re-warm a cold schema cache on the first request after a failed boot warm"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8258's boot warm (`active_record.initialize_database`,
`packages/trailties/src/trailties/active-record.ts`) rescues `ActiveRecordError`
and only warns, mirroring Rails' boot resiliency
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:146-155,175-180`).
In Rails nothing is lost by that: the schema still loads lazily on first touch
(`model_schema.rb:587-597`). In trails a synchronous `new` cannot make that
load, so if the database is down at boot, a model whose first touch is `new`
keeps raising `UnknownAttributeError` even after the database recovers.
The scaffold `create` (`Post.new(this.postParams())`) is exactly that path.
Async paths (`find`, `create`, `save`) recover, because they await
`Base.loadSchema`.

Converged shape: restore Rails' "loads on first touch" by retrying the warm at
the first async point a request passes through before user code. That is an
awaited executor/Rack hook (the `active_record.set_executor_hooks` family,
`railtie.rb:288-292`) that warms any pool whose schema cache is still cold,
then becomes a no-op.

## Acceptance criteria

- [ ] With the warm failing at boot and succeeding afterwards, the first
      scaffold-shaped `new`-based POST answers 201, not 500.
- [ ] Once every pool is warm, the hook does no extra work per request.
