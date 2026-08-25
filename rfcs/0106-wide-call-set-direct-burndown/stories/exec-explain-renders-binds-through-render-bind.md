---
title: "exec_explain should render binds through render_bind"
status: closed
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Row gone: 'exec_explain -> render_bind' is absent from origin/main scripts/api-compare/call-mismatches-exclude/activerecord/relation.json (18 entries, no exec_explain row at all). Retired by the wave-1b remainder work; nothing left to converge."
---

# `exec_explain` should render binds through `render_bind`

## Context

Surfaced finishing `wave-1b-relation-own-file-rows-remainder` (PR 6563),
which ran out of ceiling before this row.

Row still baselined in `activerecord/relation.json` (`kind: "set"`):

    exec_explain -> render_bind

(`exec_explain -> with_connection` is RFC 0073 pool-checkout divergence and
is NOT in scope.)

Rails `ActiveRecord::Explain#exec_explain`,
`activerecord/lib/active_record/explain.rb:23-42`:

    def exec_explain(queries, options = []) # :nodoc:
      str = queries.map do |sql, binds|
        msg = +"EXPLAIN"
        ...
        unless binds.empty?
          msg << "  "
          msg << binds.map { |attr| render_bind(attr) }.inspect
        end
        ...

`render_bind` is `explain.rb:57-63`.

trails has `renderBind` in `packages/activerecord/src/explain.ts` and
imports it into `relation.ts` as `_renderBind`, but `execExplain`
(`relation.ts`) does not call it on this path, so the bind list in EXPLAIN
output is not rendered the way Rails renders it.

## Converged shape

`execExplain` maps its binds through `renderBind` exactly where
explain.rb:31-34 does, and formats the result with the same `inspect`-style
array rendering.

## Acceptance criteria

- [ ] `execExplain` calls `renderBind` per explain.rb:23-42.
- [ ] Row deleted by hand (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] EXPLAIN output for a bound query matches Rails' rendering; the explain
      tests cover the shape.
- [ ] All three adapter lanes green — EXPLAIN output is adapter-specific.
