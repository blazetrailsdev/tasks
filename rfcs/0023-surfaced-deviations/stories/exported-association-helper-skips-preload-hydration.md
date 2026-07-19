---
title: "Exported association() skips preload hydration for uncached proxies"
status: ready
updated: 2026-07-19
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

`packages/activerecord/src/associations.ts:3167` — the exported
`association(record, assocName)` factory hydrates from preloaded data only
inside the `if (existing)` branch (the cached-proxy path, lines 3171-3189).
When no proxy is cached yet, it falls through to construct a fresh proxy and
never consults `_preloadedHolderTarget(record, assocName)`. The fresh proxy's
`.target` is therefore empty even though the record was just preloaded.

Surfaced by PR #4956. Two tests in `associations.test.ts` ("some already
loaded associations", "preload with only some records available with through
associations") read preloaded data via this exported helper and got
`undefined` from `.target[0]` / `.reader`, throwing
`TypeError: Cannot read properties of undefined (reading '_collectionProxies')`.
The throw was invisible because `captureSql` swallowed errors at the time; the
assertions never executed and the companion `expect(reads).toHaveLength(0)`
passed vacuously (no SQL emitted because the block died first).

PR #4956 worked around it in the tests by reading through the record's own
`.association(...)` instance method, which does hydrate. The exported
function-form deviation is untouched and still latent for any other caller.

Rails has one `association(name)` path (`ActiveRecord::Associations#association`,
`vendor/rails/activerecord/lib/active_record/associations.rb`) that consults the
association cache uniformly — there is no hydrated/un-hydrated split.

## Acceptance criteria

- The exported `association()` hydrates a freshly-constructed proxy from
  `_preloadedHolderTarget` / `_associationInstances`, matching the `existing`
  branch.
- A regression test asserts the exported form and the instance-method form
  return equivalent `.target` / `.reader` for a preloaded record.
- The `(inv as any).association(...)` workarounds in `associations.test.ts`
  can revert to the exported helper (or are confirmed still preferred).
