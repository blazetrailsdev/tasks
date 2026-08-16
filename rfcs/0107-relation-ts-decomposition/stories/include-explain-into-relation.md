---
title: "Include Explain into Relation (relation.rb:68), not just extend it onto Base"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6594
claim: "2026-08-16T12:45:04Z"
assignee: "wave-2c-grouped-calculation-and-query-method-stores"
blocked-by: null
closed-reason: null
---

## Context

Rails mixes `ActiveRecord::Explain` in on BOTH sides:

- `base.rb:294` — `extend Explain` (class-level).
- `relation.rb:68` — `include FinderMethods, ..., Explain, Delegation`
  (instance-level, so a `Relation` has `collecting_queries_for_explain` and
  `render_bind` as private instance methods).

`explain.rb:6-45` defines `module Explain` with `def
collecting_queries_for_explain` (:9) and, under `private`, `def
render_bind(connection, attr)` (:40).

trails has only the class-level half: `explain.ts` exports both as free
functions and `base.ts:267-269,2021,2032,4548,4550` wires them onto `Base` as
statics. `Relation` has neither.

Until PR #6590 `relation.ts` carried two private thunks
(`collectingQueriesForExplain`, `renderBind`) that forwarded to the `explain.ts`
free functions, giving the appearance of the instance-side mixin. They had no
callers anywhere in `packages/activerecord/src` — `loadAsync()` sets
`_asyncLoad` directly rather than routing through them — so #6590 deleted them
outright rather than moving them onto a mixin. That leaves the instance-side
`include Explain` genuinely unported.

Note `Relation#explain` itself IS ported (`relation.rb:333` →
`ExplainProxy.new(self, options)`); what is missing is the module's own two
methods reaching a `Relation` receiver.

## Acceptance criteria

- [ ] `explain.ts` exposes an `Explain` module object (or class module) carrying
      `collectingQueriesForExplain` and `renderBind` as `this`-typed members, in
      the shape `include()` / `Included<>` consumes — the idiom `relation.ts`
      now uses for every other mixed-in private (see
      `retire-relation-private-thunk-block`).
- [ ] `relation.ts` includes it, so a `Relation` receiver resolves both names,
      matching `relation.rb:68`.
- [ ] `base.ts`'s `extend`-side wiring keeps working unchanged
      (`base.rb:294` is a separate, already-correct mixin) — no duplicate
      implementation; both sides read one definition.
- [ ] `pnpm parity:api` delta non-negative; `pnpm parity:api:extra --package
activerecord` shows no new novel names.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green with no
      baseline rows added.
