---
title: "Parameter-name drift: activerecord associations"
status: ready
updated: 2026-08-28
rfc: "0000-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 84
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **21 positions over 19 matched pairs** in `associations/**`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `associations/collection_proxy.rb` — 6
- `associations/collection_association.rb` — 2
- `associations/errors.rb` — 2
- `associations/has_many_through_association.rb` — 2
- `associations/has_one_association.rb` — 2
- `associations.rb` — 1
- `associations/association_scope.rb` — 1
- `associations/belongs_to_association.rb` — 1
- `associations/builder/belongs_to.rb` — 1
- `associations/join_dependency/join_part.rb` — 1
- …and 2 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  associations.rb#association_cached? @0  `name` → `assocName`
  associations/association_scope.rb#eval_scope @1  `scope` → `scopeFn`
  associations/belongs_to_association.rb#update_counters_via_scope @1  `foreignKey` → `foreignKeyValues`
  associations/builder/belongs_to.rb#touch_record @0  `o` → `record`
  associations/collection_association.rb#add_to_target @2  `replace` → `save`
  associations/collection_association.rb#replace_on_target @3  `inversing` → `block`
  associations/collection_proxy.rb#build @0  `attributes` → `attrs`
  associations/collection_proxy.rb#create @0  `attributes` → `attrs`
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
