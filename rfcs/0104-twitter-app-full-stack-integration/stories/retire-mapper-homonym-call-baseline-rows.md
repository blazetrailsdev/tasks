---
title: "Retire the six mapper.ts homonym call-baseline rows"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7390 added six rows to
`scripts/api-compare/call-mismatches-exclude/actiondispatch/routing/mapper.json`
(five `call` rows plus one `kind: "args"` row), all with the same reason:

> Homonym artifact of porting `Mapper::Constraints` into its Rails file
> (`mapper.rb:29-81`): mapper.rb defines `initialize`, `constraints` and
> `dispatcher?` on more than one host, so the added class's members are
> compared against `Mapping`'s and `Mapper`'s call sets. No TS body omits a
> call its own Ruby counterpart makes.

They are not TS bodies omitting a Rails call. `vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb`
defines `initialize` on `Constraints` (`:35`), `Mapping` (`:132`) and `Mapper`
(`:1076`-ish), `constraints` on `Constraints` (`attr_reader`, `:30`), `Mapping`
(`:253`, `split_constraints`' caller) and `Mapper::Scoping` (`:1200`-ish), and
`dispatcher?` on `Constraints` (`:50`) and `Routing::Endpoint`. The comparer
keys a row on `(package, tsFile, rubyName, call)` with no class, so adding a
second TS `constructor` / `constraints` / `dispatcher` to `mapper.ts` made
`Mapping`'s and `Mapper`'s call sets get attributed to `Constraints`' members
(the artifact's own `tsClass` field disagrees with itself across the rows —
`Mapper` for some, `Constraints` for others).

Baselining was the fallback, not the fix: the rows are measurement noise, and
the baseline is a burndown ledger, so six rows that describe nothing real
inflate the debt metric (row count) permanently.

## Converged shape

Make the call gate class-aware for the multi-host case — carry `tsClass` (which
the artifact already computes) into the row key and match it against the Ruby
host the method was harvested from — then delete all six rows. Failing that,
`SCOPED_SKIP_GROUPS` in `scripts/parity/conventions.ts` is the existing
mechanism for "this Ruby name means something different in this file".

Do NOT close this by rewording the reason or by moving the rows elsewhere: the
outcome is six fewer baseline rows.

## Acceptance criteria

- `actiondispatch/routing/mapper.json` no longer carries the six homonym rows.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green with them
  gone, and `pnpm parity:api:calls:tighten` has narrowed any mark left stale.
- Whatever mechanism lands is general: a second Ruby host for a name in one
  file does not manufacture rows for a sibling class's members.
