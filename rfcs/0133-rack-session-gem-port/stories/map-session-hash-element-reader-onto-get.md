---
title: "Map SessionHash#[] / SecureSessionHash#[] onto get in the operator-spelling map"
status: in-progress
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 14
pr: 7380
claim: "2026-09-02T02:16:41Z"
assignee: "converge-actiondispatch-request-omitted-helpers-members"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package rack-session` reports one extra public name for
the package: `get` in `packages/rack-session/src/abstract/id.ts`.

It is not invented surface — it is the port of Ruby's element reader
`Rack::Session::Abstract::SessionHash#[]`
(`vendor/rack-session/lib/rack/session/abstract/id.rb:100`) and its override
`PersistedSecure::SecureSessionHash#[]` (`:462`). `[]` is in `OPERATORS` in
`scripts/parity/conventions.ts:353-355`, but these two hosts have no entry in
the operator-spelling map, so the comparer never pairs Ruby `[]` with TS `get`
and scores the TS name as extra surface instead.

Surfaced while porting `Rack::Session::Pool` in PR #7346 (the package's extra
surface is otherwise 0 novel / 0 moved). Predates that PR.

## Converged shape

Add the `Rack::Session::Abstract::SessionHash#[]` and
`Rack::Session::Abstract::PersistedSecure::SecureSessionHash#[]` FQNs to the
operator-spelling map in `scripts/parity/conventions.ts` so `[]` resolves to
`get`, the same way other ported element readers are spelled. Note that editing
that map reds a `scripts/` test asserting which FQNs are unmapped, so update it
in the same change.

## Acceptance criteria

- `pnpm parity:api:extra --package rack-session` reports 0 total extra surface.
- `pnpm parity:api` for `rack-session` credits `[]` on both hosts; deltas
  non-negative.
- `docs/ruby-ts-conventions.md` is regenerated, never hand-edited.
