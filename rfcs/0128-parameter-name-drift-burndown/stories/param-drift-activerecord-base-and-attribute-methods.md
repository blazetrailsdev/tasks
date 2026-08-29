---
title: "Parameter-name drift: activerecord base and attribute methods"
status: done
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 220
priority: 2
pr: 7205
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **55 positions over 54 matched pairs** in `base.rb`, `attribute_methods**` and the persistence/schema core
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `base.rb` — 16
- `attribute_methods.rb` — 14
- `attribute_methods/dirty.rb` — 8
- `persistence.rb` — 6
- `store.rb` — 3
- `core.rb` — 2
- `readonly_attributes.rb` — 2
- `attribute_methods/primary_key.rb` — 1
- `attribute_methods/read.rb` — 1
- `attribute_methods/write.rb` — 1
- …and 1 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  attribute_methods.rb#_create_record @0  `attributeNames` → `block`
  attribute_methods.rb#_update_record @0  `attributeNames` → `block`
  attribute_methods.rb#attribute_before_last_save @0  `attrName` → `attr`
  attribute_methods.rb#attribute_change_to_be_saved @0  `attrName` → `attr`
  attribute_methods.rb#attribute_for_inspect @0  `attrName` → `attr`
  attribute_methods.rb#attribute_in_database @0  `attrName` → `attr`
  attribute_methods.rb#attribute_present? @0  `attrName` → `name`
  attribute_methods.rb#format_for_inspect @0  `name` → `attr`
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
