---
title: "Converge CollectionAssociation#size onto Rails' counted arms"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6674
claim: "2026-08-17T22:43:01Z"
assignee: "converge-collection-association-size-counted-arms"
blocked-by: null
closed-reason: null
---

# Converge CollectionAssociation#size onto Rails' counted arms

## Context

`CollectionAssociation#size`
(activerecord/lib/active_record/associations/collection_association.rb:209-222)
has five arms:

```ruby
if !find_target? || loaded?            then target.size
elsif @association_ids                 then @association_ids.size
elsif !association_scope.group_values.empty?  then load_target.size
elsif !association_scope.distinct_value && !target.empty?
  unsaved_records = target.select(&:new_record?)
  unsaved_records.size + count_records
else                                   count_records
end
```

trails' getter
(packages/activerecord/src/associations/collection-association.ts, `get size`)
keeps only the first two arms and falls back to `this.target.length`: the
`group_values` arm, the unsaved + `count_records` arm and the bare
`count_records` arm are absent, because `count_records` issues a COUNT and the
getter is synchronous. The counted arms live on the awaitable
`CollectionProxy#size` instead.

Surfaced by RFC 0106 wave 3, which recorded the gap as per-row justifications on
`size | count_records`, `size | select`, `size | empty?`, `size | find_target?`
in `call-mismatches-exclude/activerecord/associations/collection-association.json`.

## Converged shape

Port the three missing arms where the counting can actually happen (Rails puts
them all in one method; trails' split between the sync getter and the awaitable
proxy is the deviation to close, not to codify), then delete the four rows by
hand via `serializeBaseline` and lower the mark with
`pnpm parity:api:calls:tighten activerecord/associations/collection-association.json`.

## Acceptance criteria

- [ ] Every Rails arm is reachable, in Rails' branch order, with Rails' guards.
- [ ] The four `size | *` rows are deleted from the exclude tree; gate green,
      no `--write`.
