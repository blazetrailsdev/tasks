---
title: "SelectManager#lock inlines Arel.sql's body to dodge an index.ts import cycle"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6357
claim: "2026-08-11T13:46:07Z"
assignee: "arel-dialect-visitor-helper-calls"
blocked-by: null
closed-reason: null
---

## Context

`Arel::SelectManager#lock` (`activerecord/lib/arel/select_manager.rb:52-63`)
calls `Arel.sql` twice — once as the parameter default, once in the `when true`
arm. PR #6323 converged the signature, the default and the `case` shape, but
had to **inline `Arel.sql`'s one-line body** (`new SqlLiteral("FOR UPDATE")`) at
both sites: `Arel.sql` is exported from `packages/arel/src/index.ts:93`, and
`index.ts` re-exports `./select-manager.js` (`index.ts:6`), so importing it back
into `select-manager.ts` closes a module cycle over index.ts's top-level
`include()` / `registerNodeDeps()` side effects. No non-test file in the package
imports `index.js` today, which is why the cycle has not surfaced before.

The deviation is cited in the `lock` JSDoc. It is debt: a Rails body that calls
`Arel.sql` is ported as one that constructs a `SqlLiteral` directly, and every
future port of a Rails body naming `Arel.sql` inherits the same problem.

## Converged shape

Move `sql` (and, if they share the hazard, `star` and the other bare `Arel.*`
factory functions in `index.ts`) into a leaf module with no runtime imports
beyond `./nodes/sql-literal.js` — the same shape as the sanctioned zero-import
slot modules (CLAUDE.md, "Call-time constant resolution"), except no mutable
binding is needed because `SqlLiteral` is already a leaf. `index.ts` re-exports
it so `Arel.sql` keeps its public name and path, and `select-manager.ts` (plus
any future caller) imports `sql` from the leaf and calls it where Rails does.

Verify the cycle is actually gone with a plain-node import of the **built**
`dist/**.js` modules as entry modules — a vitest run enters the funnel module
first and masks a TDZ.

## Acceptance criteria

- [ ] `SelectManager#lock` calls `sql(...)` at both sites Rails calls
      `Arel.sql`, with no inlined `new SqlLiteral(...)`.
- [ ] `Arel.sql` remains exported from `@blazetrails/arel`'s index at the same
      name; no public surface added (`pnpm parity:api:extra --package arel`).
- [ ] The `lock` JSDoc's cycle paragraph is deleted, not reworded.
- [ ] Built-dist import check confirms no cycle, both entry directions.
