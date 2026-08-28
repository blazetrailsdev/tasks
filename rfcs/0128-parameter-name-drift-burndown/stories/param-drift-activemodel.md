---
title: "Parameter-name drift: activemodel"
status: draft
updated: 2026-08-28
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activemodel
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 164
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **41 positions over 38 matched pairs** in `activemodel`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `dirty.rb` — 10
- `type/date_time.rb` — 3
- `type/registry.rb` — 3
- `secure_password.rb` — 2
- `type/date.rb` — 2
- `type/value.rb` — 2
- `validations/numericality.rb` — 2
- `validations/with.rb` — 2
- `attribute_methods.rb` — 1
- `attribute_mutation_tracker.rb` — 1
- …and 13 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  attribute/user_provided_default.rb#marshal_load @0  `values` → `data`
  attribute_methods.rb#attribute_alias? @0  `newName` → `name`
  attribute_mutation_tracker.rb#clone_value @0  `attrName` → `value`
  attribute_set.rb#reverse_merge! @0  `targetAttributes` → `target`
  attribute_set/builder.rb#marshal_load @0  `values` → `data`
  attribute_set/yaml_encoder.rb#decode @0  `coder` → `input`
  dirty.rb#attribute_change @0  `attrName` → `name`
  dirty.rb#attribute_changed? @0  `attrName` → `name`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package activemodel --params
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
- activemodel reads 0 rows, and enrols in the gate in this PR: add `"activemodel"` to
  `GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts` and seed its mark
  in `param-name-mark.json` at `{ "total": 0, "byFile": {} }`.
  `pnpm parity:api:params` then reports it OK.
