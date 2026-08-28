---
title: "Parameter-name drift: actionview"
status: ready
updated: 2026-08-28
rfc: "0000-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - actionview
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 60
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **14 positions over 13 matched pairs** in `actionview`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `helpers/text_helper.rb` — 4
- `helpers/tag_helper.rb` — 2
- `renderer/object_renderer.rb` — 2
- `renderer/template_renderer.rb` — 2
- `buffers.rb` — 1
- `helpers/javascript_helper.rb` — 1
- `helpers/number_helper.rb` — 1
- `template/handlers.rb` — 1

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  buffers.rb#capture @0  `args` → `fn`
  helpers/javascript_helper.rb#javascript_tag @0  `contentOrOptionsWithBlock` → `contentOrOptions`
  helpers/number_helper.rb#valid_float? @0  `number` → `n`
  helpers/tag_helper.rb#attributes @0  `attributes` → `attrs`
  helpers/tag_helper.rb#content_tag @1  `contentOrOptionsWithBlock` → `contentOrOptions`
  helpers/text_helper.rb#concat @0  `string` → `value`
  helpers/text_helper.rb#cut_excerpt_part @0  `partPosition` → `position`
  helpers/text_helper.rb#safe_concat @0  `string` → `value`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package actionview --params
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
- actionview reads 0 rows, and enrols in the gate in this PR: add `"actionview"` to
  `GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts` and seed its mark
  in `param-name-mark.json` at `{ "total": 0, "byFile": {} }`.
  `pnpm parity:api:params` then reports it OK.
