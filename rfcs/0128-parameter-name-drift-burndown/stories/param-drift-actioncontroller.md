---
title: "Parameter-name drift: actioncontroller"
status: done
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - actioncontroller
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 188
priority: 4
pr: 7251
claim: "2026-08-30T16:04:53Z"
assignee: "param-drift-actionview"
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **47 positions over 37 matched pairs** in `actioncontroller`
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `metal/request_forgery_protection.rb` — 9
- `metal/strong_parameters.rb` — 9
- `base.rb` — 4
- `metal/live.rb` — 4
- `metal.rb` — 3
- `metal/basic_implicit_render.rb` — 2
- `metal/flash.rb` — 2
- `metal/implicit_render.rb` — 2
- `metal/logging.rb` — 2
- `metal/redirecting.rb` — 2
- …and 7 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  base.rb#redirect_to @0  `options` → `url`
  base.rb#redirect_to @1  `responseOptions` → `options`
  base.rb#respond_to @0  `mimes` → `block`
  base.rb#send_file @0  `path` → `filePath`
  metal.rb#build @0  `action` → `name`
  metal.rb#dispatch @0  `name` → `action`
  metal.rb#url_for @0  `string` → `str`
  metal/allow_browser.rb#initialize @0  `request` → `userAgentString`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package actioncontroller --params
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
- actioncontroller enrols in the gate in this PR: add `"actioncontroller"` to `GATED_PACKAGES` in
  `scripts/api-compare/param-name-mark.ts` and seed its mark in
  `param-name-mark.json`. `pnpm parity:api:params` then reports it OK.
- **Settled in PR #7251 at a mark of 11, not 0.** The 43→11 rows this story
  removed were every position that was actually a RENAME. What the count does not
  distinguish, and this criterion assumed away, is a row where the Ruby
  identifier names a value the port does not hold, or where two Ruby methods
  normalise onto one TS name — neither of which a rename can fix, and both of
  which a rename would paper over by making the code lie. Those are filed with
  their `vendor/rails` `file:line` in [[param-drift-actioncontroller-structural-residue]]; the mark is only-shrink and burns
  down there.
