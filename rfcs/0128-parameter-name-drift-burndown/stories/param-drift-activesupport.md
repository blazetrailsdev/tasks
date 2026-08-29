---
title: "Parameter-name drift: activesupport"
status: in-progress
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activesupport
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 252
priority: 2
pr: 7209
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **63 positions over 60 matched pairs** in `activesupport`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `core_ext/enumerable.rb` — 10
- `callbacks.rb` — 6
- `hash_with_indifferent_access.rb` — 4
- `cache.rb` — 3
- `core_ext/array/extract_options.rb` — 3
- `duration.rb` — 3
- `testing/method_call_assertions.rb` — 3
- `time_with_zone.rb` — 3
- `cache/serializer_with_fallback.rb` — 2
- `core_ext/module/attr_internal.rb` — 2
- …and 18 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  cache.rb#_instrument @2  `options` → `key`
  cache.rb#delete_multi_entries @0  `entries` → `keys`
  cache.rb#fetch_multi @0  `names` → `namesAndBlock`
  cache/serializer_with_fallback.rb#_load @0  `entry` → `dumped`
  cache/serializer_with_fallback.rb#dump @0  `entry` → `entryOrValue`
  callbacks.rb#delete @0  `o` → `cb`
  callbacks.rb#expand_call_template @0  `arg` → `env`
  callbacks.rb#index @0  `o` → `cb`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package activesupport --params
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
- activesupport reads 0 rows, and enrols in the gate in this PR: add `"activesupport"` to
  `GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts` and seed its mark
  in `param-name-mark.json` at `{ "total": 0, "byFile": {} }`.
  `pnpm parity:api:params` then reports it OK.
