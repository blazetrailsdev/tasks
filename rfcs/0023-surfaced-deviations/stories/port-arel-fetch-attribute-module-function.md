---
title: "Port Arel.fetch_attribute (arel.rb:68) and drop the hand-rolled local copies"
status: draft
updated: 2026-07-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`arel.rb:68` defines a module-level helper that trails does not port:

```ruby
def self.fetch_attribute(value, &block) # :nodoc:
  ...
  value.fetch_attribute(&block)
end
```

`@blazetrails/arel` ports the per-node `fetchAttribute` methods
(`nodes/node.ts`, `binary.ts`, `grouping.ts`, `nary.ts`, `homogeneous-in.ts`,
`sql-literal.ts`, `equality.ts`, `in.ts`) but exports no module-level
`fetchAttribute`. Consumers hand-roll it: `relation/where-clause.ts` has a
file-local `fetchAttribute` (renamed from `fetchAttributeNode` in PR #5340 so
the wide call-set check matches) plus a near-duplicate `extractAttribute`.

The rename made the api:compare wide call check pass, but the underlying arel
surface is still missing, and the duplicate local helpers are a smell — Rails
has exactly one `Arel.fetch_attribute` plus `WhereClause#extract_attribute`.

## Acceptance criteria

- `Arel.fetchAttribute(value, block)` is ported and exported from
  `@blazetrails/arel`, matching `arel.rb:68` including its nil/non-node guard.
- `where-clause.ts`'s file-local `fetchAttribute` is deleted in favour of the
  arel export; `extractAttribute` is kept only if it still corresponds to
  Rails' distinct `extract_attribute` private method.
- api:compare extra-surface and wide-call gates stay green.
