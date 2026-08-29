---
title: "Parameter-name drift: activerecord relation and scoping"
status: done
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 232
priority: 2
pr: 7200
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **58 positions over 52 matched pairs** in `relation.rb`, `relation/**` and `scoping**`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `relation.rb` — 20
- `relation/query_methods.rb` — 12
- `scoping.rb` — 12
- `relation/calculations.rb` — 6
- `relation/delegation.rb` — 3
- `querying.rb` — 2
- `relation/finder_methods.rb` — 2
- `relation/predicate_builder.rb` — 1

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  querying.rb#async_find_by_sql @3  `allowRetry` → `block`
  querying.rb#find_by_sql @3  `allowRetry` → `block`
  relation.rb#any? @0  `args` → `pattern`
  relation.rb#build @0  `attributes` → `attrs`
  relation.rb#create @0  `attributes` → `attrs`
  relation.rb#create! @0  `attributes` → `attrs`
  relation.rb#delete @0  `idOrArray` → `id`
  relation.rb#delete_by @0  `args` → `conditions`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params
```

lists every remaining position as `file:method  @position  ruby \`x\` ts \`y\``.
The story is done when that list is empty for the scope above.

Read each row before renaming it — see the RFC's "three shapes" section. A
union-type name (`columnOrOptions`) still takes the Rails identifier: the type
describes what the argument may be, the name describes what it is. A positional
misalignment — a dropped Rails parameter reported as a rename of its neighbour —
belongs to `param-drift-positional-misalignment-is-a-dropped-parameter` and is
left alone here.

## Acceptance criteria

- Every parameter in scope carries the Rails identifier, camelCased per
  `docs/ruby-ts-conventions.md`, verified against `vendor/rails`.
- No behaviour change and no test renamed; `pnpm parity:api` methods and arity
  figures unmoved, `parity:api:calls` and `parity:api:calls:args` no new row.
- There is no exclude register for parameter names and none is added. A position
  that genuinely cannot carry the Rails name is a `pnpm tasks block` naming the
  language shortcoming.
