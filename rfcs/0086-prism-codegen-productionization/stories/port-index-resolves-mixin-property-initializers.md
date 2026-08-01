---
title: "Port index classifies mixin-assigned methods as readables"
status: ready
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extractPortSymbols` in `scripts/prism-codegen/port-symbols.ts` (added by PR 5831) classifies a class property whose initializer is not literally a
function as a _readable_, because `static aliasAttribute = aliasAttribute`
(the repo's module-mixin convention, see CLAUDE.md) is textually
indistinguishable from `static tableName = "widgets"`.

The consequence is a tree-wide veto: any name mixed in that way is excluded
from `callableNames`, so a paren-less self-call on it keeps emitting a bare
property access even when the port genuinely holds a function there. This was
the deliberately conservative choice in #5831 (it preserves prior output), but
it caps how many self-calls the port index can correct.

Resolving an identifier initializer to its imported declaration — the same
port tree is already parsed in `mergePortSymbols` — would classify these
correctly.

## Acceptance criteria

- A class property initialized from an identifier that resolves (through the
  file's imports) to a function declaration is classified as a callable.
- A property initialized from a non-function value stays a readable; the
  tree-wide getter veto is unchanged.
- Unresolvable identifiers stay readables (conservative default preserved).
- Goldens regenerated; `pnpm codegen:score` matched count does not regress.
