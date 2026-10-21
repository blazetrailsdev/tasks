---
title: "erubi-engine-members-or-tse-compiler-relocation-row"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9167
claim: "2026-10-21T12:41:51Z"
assignee: "tse-undefined-local-raises-template-error"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (forced run, 2026-10-20) counts
`template/handlers/erb/erubi.rb` as a missing file —
`template/handlers/tse/erubi.ts` does not exist — with **6 methods missing**:
`constructor`, `addText`, `addExpression`, `addCode`, `addPostamble`,
`flushNewlineIfPending`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb/erubi.rb:9-...`).

Root CLAUDE.md § "Templates are precompiled" rules that **`compileJs` is the
Erubi step** and names `@blazetrails/tse-compiler` as what "turns TSE into JS,
as Erubi turns ERB into Ruby". So the behaviour is ported, in another package,
and the question this story settles is bookkeeping: whether the six members
belong in `packages/actionview/src/template/handlers/tse/erubi.ts` mirroring
the Ruby path (the usual answer — `parity:api` maps by path), or whether the
relocation to tse-compiler gets a register row citing that section.

`port-erb-erubi-bufvar` (est 120) is `done` and `erubi-engine-generator-hooks`
exists, so read both before choosing; the newline-pending and `bufvar`
handling may already live in the compiler under different names.

## Acceptance criteria

- Either the six members exist at
  `template/handlers/tse/erubi.ts` at their Rails names, or
  `scripts/parity/unported-files/actionview.ts` carries a row for
  `template/handlers/erb/erubi.rb` citing root CLAUDE.md
  § "Templates are precompiled" and naming the tse-compiler members that
  answer them.
- `pnpm parity:api` shows actionview's missing count down by 6 either way, and
  the chosen route is stated in the PR body.
