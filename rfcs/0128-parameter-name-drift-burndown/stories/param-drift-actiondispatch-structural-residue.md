---
title: "param-drift-actiondispatch-structural-residue"
status: done
updated: 2026-08-31
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: 7302
claim: "2026-08-31T15:54:33Z"
assignee: "template-render-takes-view-before-locals"
blocked-by: null
closed-reason: null
---

## Context

`param-drift-actiondispatch` (PR pending) took actiondispatch from 84 rows to 2
and enrolled it in `pnpm parity:api:params` at a mark of 2. Both survivors are
structural port divergences, not renames — each needs its own convergence, which
is why they were left out of that PR rather than papered over with a rename.

### 1. `http/headers.rb#initialize` — `request` spelled `env`

`ActionDispatch::Http::Headers` wraps a **Request** in Rails
(`vendor/rails/actionpack/lib/action_dispatch/http/headers.rb:58-60`: `@req =
request`), and every reader goes through `@req.get_header` / `set_header` /
`fetch_header` / `each_header`. The trails port
(`packages/actionpack/src/action-dispatch/http/headers.ts:41-46`) holds the env
hash directly (`this._env = env`) and indexes it. Renaming the parameter to
`request` would misdescribe the value, so the row only clears once the class
holds a request.

The blocker is a module cycle: `Headers.from_hash(hash)` is
`new(ActionDispatch::Request.new hash)` (headers.rb:54-56) and `request.ts:69`
already imports `headers.js`, so a plain `import { Request }` in `headers.ts`
closes a cycle. The sanctioned shape is the zero-import slot module (CLAUDE.md,
"Call-time constant resolution") — a `request-slot.ts` that `request.ts`
populates at the bottom of its body. `request.ts:757-758` (`get headers()`) then
passes `this` rather than `this.env`, and
`packages/actionpack/src/action-dispatch/dispatch/header.test.ts` (which
constructs `new Headers(hash)`) moves to `Headers.fromHash`.

### 2. `http/request.rb#format` — a get/set accessor cannot carry two Ruby names

Rails has two methods, with different parameter names:
`format(_view_path = nil)` (`http/mime_negotiation.rb:63`) and
`format=(extension)` (`mime_negotiation.rb:115`). trails spells the pair as one
TS accessor (`request.ts:409-414`), so `format`'s single settable parameter is
compared against BOTH — it matches `format=` and is charged a rename against the
getter. Naming it `viewPath` just moves the row onto `format=`; the count is 1
either way.

The candidate fix is the settled `setX()` idiom (CLAUDE.md, "Fidelity is the
job"): keep `get format()` (0 params — it then aligns with no Ruby form and
leaves the compared population entirely) and move the write half to
`setFormat(extension)`. That changes a public surface (`req.format = x`), so it
needs its own review, and `formats` / `formats=` next door should be decided at
the same time.

## Acceptance criteria

- Both positions carry the Rails identifier, verified against `vendor/rails` at
  the cited `file:line`, or the one that genuinely cannot is a `pnpm tasks block`
  naming the language shortcoming.
- `actiondispatch`'s mark in `scripts/api-compare/param-name-mark.json` is
  narrowed with `pnpm parity:api:params:tighten` (never rewritten upward), and
  `pnpm parity:api:params` reports actiondispatch 0/0.
- No test renamed; `pnpm parity:api` methods/arity unmoved, `parity:api:calls`
  and `parity:api:calls:args` no new row.
