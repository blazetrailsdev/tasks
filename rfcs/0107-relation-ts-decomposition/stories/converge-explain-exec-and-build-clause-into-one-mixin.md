---
title: "Move exec_explain/build_explain_clause into the Explain mixin so Base and Relation read one definition"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6598
claim: "2026-08-16T14:45:06Z"
assignee: "wave-2c-grouped-calculation-and-query-method-stores"
blocked-by: null
closed-reason: null
---

## Context

PR #6594 (`include-explain-into-relation`) added an `Explain` module object to
`packages/activerecord/src/explain.ts` carrying `collectingQueriesForExplain`
and `renderBind`, and included it into `Relation` (`relation.rb:68`). It
deliberately left the module's other two members out of scope.

`vendor/rails/activerecord/lib/active_record/explain.rb` defines four members
on `module Explain`:

- `collecting_queries_for_explain` (:9) — now shared.
- `exec_explain(queries, options = [])` (:19-36) — public.
- `render_bind(connection, attr)` (:40-51) — private, now shared.
- `build_explain_clause(connection, options = [])` (:53-59) — private.

Because Rails mixes the one module in on both sides (`base.rb:294`
`extend Explain`, `relation.rb:68` `include ... Explain ...`), a `Relation`
and a model class run the SAME `exec_explain` and `build_explain_clause`.

trails has three separate implementations of that pair:

- `packages/activerecord/src/explain.ts` `execExplain` / `buildExplainClause`
  — the class-level pair, wired onto `Base` at `base.ts:2024-2035,4548-4551`.
  `execExplain` there is a thunk that calls `modelClass.all().execExplain(...)`.
- `packages/activerecord/src/relation.ts` `execExplain` (~~:2906) and the
  private `buildExplainClause` (~~:3062) — a second, much larger pair, with its
  own `_renderExplainBinds` / `_normalizeExplainBindValue` helpers that
  re-derive `render_bind`'s binary branch rather than calling `renderBind`.

So the class side reaches the Relation side by delegation, and the Relation
side duplicates logic the shared `renderBind` already has.

## Converged shape

`exec_explain` and `build_explain_clause` become members of the `Explain`
module object in `explain.ts`, `this`-typed like the other two, written
against `explain.rb:19-36` and `:53-59`. `Relation` gets them from
`include(Relation, Explain)`; `base.ts` keeps its `extend`-side wiring on the
same definitions. `relation.ts`'s `execExplain`, `buildExplainClause`,
`_renderExplainBinds` and `_normalizeExplainBindValue` are deleted, with the
bind rendering going through `renderBind` (explain.rb:40-51) as Rails' own
`exec_explain` does at :24.

Note `0106-wide-call-set-direct-burndown` already carries
`exec-explain-renders-binds-through-render-bind` for the narrower
"exec_explain must call render_bind" call-set row. This story is the
decomposition half — one definition reached from both mixin sites — and
subsumes it if it lands first.

## Acceptance criteria

- [ ] `explain.ts`'s `Explain` module object carries all four members of
      `explain.rb`'s `module Explain`.
- [ ] `Relation` resolves `execExplain` / `buildExplainClause` through the
      mixin; no second copy in `relation.ts`.
- [ ] `base.ts`'s `extend`-side wiring reads the same definitions, unchanged
      in behaviour.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel names;
      `pnpm parity:api:calls` / `:args` green with no baseline rows added.
- [ ] `explain.test.ts` and the adapter EXPLAIN tests pass on SQLite,
      PostgreSQL and MySQL/MariaDB.
