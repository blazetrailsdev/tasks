---
title: "As#toCte yields undefined for a nameless left where Rails raises NoMethodError"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Closing as not convergeable and marginal: Rails' failure here is Ruby's NoMethodError, for which trails has no analogue, so the story asks to invent an error Rails does not have. The well-formed path (binary.ts:161) already matches Cte.new(left.name, right)."
---

## Context

`As#toCte` (`packages/arel/src/nodes/binary.ts`) reads the CTE name off `left`
through a cast:

```ts
const name = (this.left as { name: string | SqlLiteral }).name;
return cteFactory(name, this.right as Node);
```

That mirrors Rails' `Cte.new(left.name, right)` (`binary.rb:43-45`) for the
well-formed case, which is what PR #5741 fixed (the arguments had been
inverted). But the failure mode diverges: in Ruby, a `left` that does not
respond to `name` raises `NoMethodError` at `to_cte`. In TS the cast yields
`undefined`, which flows on into `Cte` and surfaces later as
`quoteTableName(undefined)` — a confusing error at a different site, or
`WITH "undefined" AS (...)`.

Deliberately left as-is in #5741 rather than inventing an error Rails does not
have; filing so the shape is decided rather than defaulted.

The reachable path is `As` nodes built for a `WITH` whose `left` is not a
`Table` / `TableAlias` / `Cte` — e.g. `Arel::Nodes::As.new(some_attribute, q)`
routed to `SelectManager#with`.

## Acceptance criteria

- Decide and implement the faithful failure shape for a `left` with no `name`.
  Rails raises `NoMethodError`; the trails analogue is whatever the repo already
  uses for a Ruby `NoMethodError` port (check `packages/activerecord/src/errors`
  and how other ports spell it) rather than a bespoke message.
- Whatever is chosen, the error names `to_cte` / the offending node so it is not
  attributed to `quoteTableName`.
- A test covers the bad-`left` path; it must fail on the current `undefined`
  behavior.
- No change to the well-formed path — `packages/arel` stays green, in particular
  `as.test.ts` `#to_cte` and `select-manager.test.ts` `with`.
