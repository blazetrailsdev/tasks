---
title: "With/WithRecursive visitors bypass collectCtes and skip to_cte"
status: draft
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
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

Found while sweeping unrouted arel privates in PR #5025 (story
`arel-unrouted-privates-drop-carried-arguments`).

`packages/arel/src/visitors/to-sql.ts` defines `collectCtes(children, collector)`
but nothing calls it. `visitArelNodesWith` and `visitArelNodesWithRecursive`
inject-join the raw children instead:

```ts
private visitArelNodesWith(node, collector) {
  collector.append("WITH ");
  this.injectJoin(node.children, ", ", collector);
  return collector;
}
```

Rails `to_sql.rb:198-206` routes both through `collect_ctes`, and
`collect_ctes` (`to_sql.rb:1023-1030`) visits `child.to_cte` — not the child:

```ruby
def collect_ctes(children, collector)
  children.each_with_index do |child, i|
    collector << ", " unless i == 0
    visit child.to_cte, collector
  end
  collector
end
```

So trails skips the `to_cte` conversion entirely. Trails' `collectCtes` already
has the `toCte()` branch written, it is simply never reached. Any child whose
`to_cte` differs from itself is rendered wrong.

## Acceptance criteria

- `visitArelNodesWith` / `visitArelNodesWithRecursive` route through
  `collectCtes`, matching to_sql.rb:198-206.
- Confirm against `nodes/cte.rb` / `table_alias.rb` which node types define
  `to_cte` and how their CTE form differs, then pin a test where
  `to_cte` is NOT identity — that is the case the current code breaks and a
  same-node test would pass regardless.
- Remove any wide-baseline entries that converge (`visit_Arel_Nodes_With ->
collect_ctes`, `visit_Arel_Nodes_WithRecursive -> collect_ctes`). Re-run
  `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls` before `pnpm api:calls:wide`.
