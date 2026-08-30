---
title: "type-generated-attribute-accessors-with-divergent-get-set"
status: ready
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 27
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Rails attribute writer takes the raw value and the reader returns the
type-cast one, so the two halves have different types:

```ruby
record.bonus_time = time_string   # attribute_methods/write.rb:36 — _write_attribute(name, value)
record.bonus_time                 # attribute_methods/read.rb:35  — _read_attribute -> TimeWithZone
```

`packages/activerecord/src/attribute-methods.test.ts:605-612` exercises exactly
that: it assigns a `string`, reads back a `TimeWithZone`, then assigns `""` and
reads `null`. `attributes.test.ts:74` does the same for a float
(`data.overloaded_float = "1.1"` reads `1`).

A generated reader in trails is an accessor property (see CLAUDE.md,
"Generated attribute readers are properties"), and a `declare x: T` field forces
one type on both halves. PR #7222 therefore had to type these attributes
`unknown` or `any` — `bonus_time`, `created_at`, `starts_on`, `updated_at`,
`overloaded_float`, `non_existent_decimal` — which is strictly worse than what
Rails offers a caller.

## Converged shape

TypeScript models divergent get/set types on an accessor pair, which is what a
generated attribute method already is. Emit the generated property (and its
`.d.ts` shape, which is what the virtualized DX tooling synthesizes) with a
`get` returning the cast type and a `set` accepting the raw one, so
`declare` sites can name the real reader type instead of `unknown`.

Related: `apply-hook-attribute-type-inside-activemodel-attribute` (same
generation path).

## Acceptance criteria

- [ ] A generated attribute accessor's reader type and writer type can differ.
- [ ] The `unknown`/`any` declares named above are narrowed to the reader type.
- [ ] A DX type test pins the asymmetry for a `datetime` and a `float`.
- [ ] `pnpm typecheck` clean; AR suite green on all three lanes.
