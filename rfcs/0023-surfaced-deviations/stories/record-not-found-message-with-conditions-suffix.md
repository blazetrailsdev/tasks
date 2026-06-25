---
title: "record-not-found-message-with-conditions-suffix"
status: ready
updated: 2026-06-25
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
---

## Context

`raiseRecordNotFoundExceptionBang` (and the shared `raiseRecordNotFoundException`
builder) in `packages/activerecord/src/relation/finder-methods.ts` produce only
`"Couldn't find ${name}"` on the no-args path. Rails appends a
`" with [conditions]"` suffix when a where clause is present:

```ruby
# activerecord/lib/active_record/relation/finder_methods.rb:417-431
def raise_record_not_found_exception!(ids = nil, result_size = nil, expected_size = nil, key = primary_key, not_found_ids = nil)
  conditions = " [#{arel.where_sql(model)}]" if ids.nil? && relation_scoping?
  # ...
  if Array.wrap(ids).size == 1
    error = +"Couldn't find #{name}"
    error << " with#{conditions}" if conditions
    # ...
```

So `Topic.where(title: "foo").firstBang()`:

- trails: `"Couldn't find Topic"`
- Rails: `"Couldn't find Topic with [WHERE topics.\"title\" = 'foo']"`

This is a **pre-existing** deviation surfaced during review of PR #4100
(finder-bang-ordinal-raise-record-not-found-message-fidelity) — the builder
already shipped with the bare message on `main`; that PR only routed the bang
ordinal/take finders through the builder, it did not introduce the gap.

## Acceptance criteria

- `raiseRecordNotFoundException` / `raiseRecordNotFoundExceptionBang` append
  `" with [${conditions}]"` when invoked with no ids and an active where-clause
  scope, matching Rails `finder_methods.rb:417-431` — including rendering the
  where SQL via the relation's arel (`arel.where_sql(model)` equivalent).
- Tests asserting the exact `"Couldn't find ${name} with [...]"` message, named
  to match the corresponding Rails finder tests (read them first).
- api:compare and test:compare delta non-negative.
- Converge, do not ratify (this is a deviation, not a wontfix).
