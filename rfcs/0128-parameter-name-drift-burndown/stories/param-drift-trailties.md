---
title: "Parameter-name drift: trailties"
status: in-progress
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - trailties
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 68
priority: 4
pr: 7211
claim: "2026-08-29T16:03:46Z"
assignee: "param-drift-tail-packages"
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **17 positions over 15 matched pairs** in `trailties`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `engine/lazy_route_set.rb` — 2
- `generators/actions.rb` — 2
- `generators/migration.rb` — 2
- `application.rb` — 1
- `code_statistics_calculator.rb` — 1
- `engine.rb` — 1
- `engine/railties.rb` — 1
- `generators/database.rb` — 1
- `generators/model_helpers.rb` — 1
- `info.rb` — 1
- …and 4 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  application.rb#message_verifier @0  `verifierName` → `name`
  code_statistics_calculator.rb#add @0  `codeStatisticsCalculator` → `other`
  engine.rb#find_root_with_flag @2  `default` → `fallback`
  engine/lazy_route_set.rb#generate_extras @1  `recall` → `defaults`
  engine/lazy_route_set.rb#recognize_path @1  `environment` → `options`
  engine/railties.rb#each @0  `args` → `fn`
  generators/actions.rb#execute_command @0  `executor` → `name`
  generators/actions.rb#execute_command @2  `options` → `opts`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package trailties --params
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
- trailties reads 0 rows, and enrols in the gate in this PR: add `"trailties"` to
  `GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts` and seed its mark
  in `param-name-mark.json` at `{ "total": 0, "byFile": {} }`.
  `pnpm parity:api:params` then reports it OK.
