---
title: "activesupport: delete the free hexdigest wrapper; callers name ActiveSupport::Digest.hexdigest"
status: done
updated: 2026-11-20
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10431
claim: "2026-11-20T17:30:40Z"
assignee: "active-support-namespace-seats-test-case"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/hexdigest.ts` exports a free `hexdigest(data)` that only forwards to
`Digest.hexdigest(data)`. Rails has no such top-level method: callers name the module,
`ActiveSupport::Digest.hexdigest(...)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/digest.rb`).
trails#8319 moved `Relation#compute_cache_key` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:444`)
onto `Digest.hexdigest`; two callers of the wrapper remain:

- `packages/activesupport/src/cache/file-store.ts:179` — Rails is `fname = ActiveSupport::Digest.hexdigest(key)`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/file_store.rb:167`).
- `packages/activerecord/src/support/schema-cache-dump.ts:72`.

`Digest` is importable as `@blazetrails/activesupport/digest`; a package newly importing that subpath needs
the path in its `dx-tests/tsconfig.json` (trails#8319 added it for activerecord).

## Acceptance criteria

- [ ] Both callers call `Digest.hexdigest(...)`.
- [ ] `packages/activesupport/src/hexdigest.ts` and its `index.ts` export are deleted.
- [ ] `pnpm parity:api:calls` and `pnpm test:types` stay green.
