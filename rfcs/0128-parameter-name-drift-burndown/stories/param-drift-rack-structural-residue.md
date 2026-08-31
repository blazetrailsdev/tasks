---
title: "param-drift-rack-structural-residue"
status: in-progress
updated: 2026-08-31
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: 7315
claim: "2026-08-31T21:03:42Z"
assignee: "param-drift-actionview-structural-residue"
blocked-by: null
closed-reason: null
---

## Context

`param-drift-rack` took rack from 29 param-name rows to 3 and enrolled it in
`pnpm parity:api:params` at a mark of 3. None of the three is a rename.

### 1. `headers.rb#key?` — a name collision

`Rack::Headers` aliases `key?` to `has_key?(key)`
(`vendor/rack/lib/rack/headers.rb:144-148`). Under
`docs/ruby-ts-conventions.md` a Ruby `?` predicate drops the mark, so `key?`
normalises to the TS name `key` — which `packages/rack/src/headers.ts:221`
already uses for the _other_ Ruby method, `Hash#key(value)` (returns the key for
a value; inherited, not redefined in headers.rb). `has_key?` itself is ported as
`hasKey` (`headers.ts:77`), so the alias has no TS declaration of its own and
the comparer scores it against `key(value)`, reporting `value` as a rename of
`key`.

Two shapes to weigh: give `key?` its own declaration under a spelling that does
not collide (and check `include?` / `member?`, the other two aliases of
`has_key?`, at the same time), or record the collision in `SCOPED_SKIP_GROUPS`
in `scripts/parity/conventions.ts` — note the CLAUDE.md warning to grep
`SCOPED_SKIP_GROUPS` before adding a global `SKIP`.

### 2 and 3. `files.rb#serving` and `method_override.rb#method_override_param` — the port holds the env, not the request

`Rack::Files#serving(request, path)` (`vendor/rack/lib/rack/files.rb:68`) takes a
`Rack::Request` and calls `request.options?` / `request.get_header(...)`;
`Rack::MethodOverride#method_override_param(req)` (`method_override.rb:48`) takes
one too and calls `req.POST` / `req.form_data?`. Both trails ports index the env
hash directly — `packages/rack/src/files.ts:153` (`env["REQUEST_METHOD"]`,
`env["HTTP_IF_MODIFIED_SINCE"]`, `env["HTTP_RANGE"]`) and
`packages/rack/src/method-override.ts:56` (`env["CONTENT_TYPE"]`,
`env[RACK_INPUT]`) — so spelling either parameter `request` would misdescribe the
value, which is why `param-drift-rack` reverted that rename rather than shipping
it. Same shape, and same remedy, as
[[param-drift-actiondispatch-structural-residue]]'s `http/headers.rb#initialize`
row: the position clears once the port holds a request. `Files#call` and
`Files#get` (`files.ts:115,121`) take the env in Rails too (`files.rb:47,58`), so
the conversion is confined to `serving` and its caller at `files.ts:150`.

## Acceptance criteria

- Every position carries the Rails identifier, verified against `vendor/rack` at
  the cited `file:line`, or the one that genuinely cannot is a
  `pnpm tasks block` naming the shortcoming.
- rack's mark in `scripts/api-compare/param-name-mark.json` is narrowed with
  `pnpm parity:api:params:tighten` (never rewritten upward), and
  `pnpm parity:api:params` reports rack 0/0.
- No test renamed; `pnpm parity:api` methods/arity unmoved, `parity:api:calls`
  and `parity:api:calls:args` no new row.
