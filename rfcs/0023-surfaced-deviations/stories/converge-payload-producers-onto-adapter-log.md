---
title: "Converge inline sql.active_record payload literals onto AbstractAdapter#log"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4998 (`type-casted-binds-payload-self-dispatch`), which converged
the `type_casted_binds` slot but left the payload _construction_ diverged.

Rails has ONE `sql.active_record` payload producer: `AbstractAdapter#log`
(`abstract_adapter.rb:1134`), which takes `type_casted_binds = []` as a
parameter and whose callers pass the value (sometimes a lambda) in. Every
adapter query path goes through it.

trails has `AbstractAdapter#log` at
`connection-adapters/abstract-adapter.ts:2373` with the Rails-shaped signature
— and **zero callers**. Verified with:

```text
git grep -nE "(this|adapter|conn(ection)?)\.log\(" -- \
  'packages/activerecord/src/connection-adapters/**/*.ts' | grep -v '\.test\.'
# -> 0 results
```

Instead, 15 sites build the payload object literal inline (`mysql2-adapter.ts`
x4, `sqlite3-adapter.ts` x2, `postgresql-adapter.ts` x5, plus `logSql` and
`cacheNotificationInfo`). #4998 fixed what each literal puts in the
`type_casted_binds` slot, but the duplication itself is the deviation: any new
payload key has to be added in 15 places, and they already drift (MySQL reports
driver binds, PG reports rewritten binds, one sqlite3 site hardcodes `[]`).

This was explicitly out of scope for #4998 — that story called strategy D
"Rails-SHAPED, not a divergence in itself" and said the fix belongs at its
callers. This is that follow-up.

## Acceptance criteria

- [ ] Adapter query paths route their `sql.active_record` instrumentation
      through `AbstractAdapter#log` rather than an inline payload literal, so
      there is one producer as in `abstract_adapter.rb:1134`.
- [ ] `log` either gains the callers it lacks or is deleted if a different
      single producer is chosen — it must not remain a Rails-shaped method with
      zero callers.
- [ ] Payload key drift is resolved or documented per adapter (MySQL driver
      binds vs PG rewritten binds vs sqlite3's hardcoded `[]` at
      `sqlite3-adapter.ts:758`, which is correct only because `binds` is `[]`).
- [ ] Cached and uncached payloads stay equal — the invariant pinned by
      `type-casted-binds-payload.trails.test.ts`.
