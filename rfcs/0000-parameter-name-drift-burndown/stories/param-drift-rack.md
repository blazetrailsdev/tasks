---
title: "Parameter-name drift: rack"
status: draft
updated: 2026-08-28
rfc: "0000-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - rack
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 196
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **49 positions over 39 matched pairs** in `rack`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `null_logger.rb` — 12
- `events.rb` — 9
- `headers.rb` — 7
- `request.rb` — 7
- `utils.rb` — 7
- `files.rb` — 2
- `builder.rb` — 1
- `deflater.rb` — 1
- `method_override.rb` — 1
- `multipart/parser.rb` — 1
- …and 1 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  builder.rb#warmup @0  `prc` → `block`
  deflater.rb#initialize @1  `options` → `opts`
  events.rb#on_commit @0  `request` → `req`
  events.rb#on_commit @1  `response` → `res`
  events.rb#on_error @0  `request` → `req`
  events.rb#on_error @1  `response` → `res`
  events.rb#on_error @2  `e` → `error`
  events.rb#on_finish @0  `request` → `req`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package rack --params
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
- rack reads 0 rows, and enrols in the gate in this PR: add `"rack"` to
  `GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts` and seed its mark
  in `param-name-mark.json` at `{ "total": 0, "byFile": {} }`.
  `pnpm parity:api:params` then reports it OK.
