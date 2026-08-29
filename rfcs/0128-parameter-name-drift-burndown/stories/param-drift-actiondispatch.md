---
title: "Parameter-name drift: actiondispatch"
status: ready
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - actiondispatch
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 336
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **84 positions over 79 matched pairs** in `actiondispatch`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `routing/mapper.rb` — 10
- `routing/route_set.rb` — 9
- `http/url.rb` — 6
- `middleware/debug_exceptions.rb` — 6
- `middleware/stack.rb` — 6
- `http/content_security_policy.rb` — 5
- `http/headers.rb` — 4
- `http/mime_type.rb` — 4
- `http/request.rb` — 4
- `http/response.rb` — 3
- …and 16 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  http/content_disposition.rb#percent_escape @0  `string` → `str`
  http/content_security_policy.rb#build @0  `context` → `request`
  http/content_security_policy.rb#plugin_types @0  `types` → `sources`
  http/content_security_policy.rb#report_uri @0  `uri` → `sources`
  http/content_security_policy.rb#require_sri_for @0  `types` → `sources`
  http/content_security_policy.rb#sandbox @0  `values` → `sources`
  http/headers.rb#fetch @1  `default` → `args`
  http/headers.rb#initialize @0  `request` → `env`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package actiondispatch --params
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
- actiondispatch reads 0 rows, and enrols in the gate in this PR: add `"actiondispatch"` to
  `GATED_PACKAGES` in `scripts/api-compare/param-name-mark.ts` and seed its mark
  in `param-name-mark.json` at `{ "total": 0, "byFile": {} }`.
  `pnpm parity:api:params` then reports it OK.
