---
title: "composite-query-constraints-list-drops-memo"
status: closed
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Operator triage 2026-10-18 (RFC 0189 refine): all parity axes at 100%; this is structural/shape fidelity with no user-observable behavior change — not worth pursuing. Closed as won't-fix."
---

## Context

`pnpm codegen:score` scores `active_record/persistence.rb ::
compositeQueryConstraintsList` as divergent; the `conformance-triage-burndown`
triage verified it as a real deviation.

Rails (`vendor/rails/activerecord/lib/active_record/persistence.rb:234-236`):

```ruby
def composite_query_constraints_list # :nodoc:
  @composite_query_constraints_list ||= query_constraints_list || Array(primary_key)
end
```

trails (`packages/activerecord/src/persistence.ts:215-220`) drops the `||=`
memo and recomputes on every call:

```ts
export function compositeQueryConstraintsList(this: PersistenceHost): string[] {
  const list = queryConstraintsList.call(this);
  if (list) return list;
  const pk = this.primaryKey;
  return Array.isArray(pk) ? pk : [pk];
}
```

Beyond the per-call cost, the memo is class-level state Rails resets alongside
the other schema memos (`reload_schema_from_cache`), so the two differ after a
schema reload as well as in identity of the returned array.

## Acceptance criteria

- The memo is ported at the Rails name (`@composite_query_constraints_list`),
  including its reset wherever Rails clears it.
- The `…persistence.rb::compositeQueryConstraintsList::divergent` baseline row
  is deleted.
