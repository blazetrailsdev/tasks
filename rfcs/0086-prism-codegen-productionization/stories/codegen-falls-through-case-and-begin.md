---
title: "Recognise terminal case/begin arms in fallsThrough"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`fallsThrough` in `scripts/prism-codegen/await-policy.ts` (added by #5837)
decides whether a branch arm reaches the code after the construct. It handles
`ReturnNode`, `NextNode`, `BreakNode`, a `raise` that becomes a `throw`, and a
nested `IfNode`/`UnlessNode`. Every other last-statement kind falls back to
`return true` — conservatively non-terminal, which only costs awaits.

Two shapes are common enough to be worth recognising:

- a `CaseNode` with an `else` whose every arm is terminal
  (`scripts/prism-codegen/handlers/control.ts` `caseStmt`), and
- a `BeginNode` whose body and rescue arm are both terminal
  (same file, the `BeginNode` handler).

Both are emitted as real branching TS, so their terminality is decidable the
same way `IfNode` already is.

Terminality must keep matching what the emitter actually produces, not Ruby
semantics — that was the review finding on #5837 that forced `isRaiseThrow`
and the `inLoop`/`argumentCount` gates. A `case` whose handler bails out
(`caseStmt` returns `null` for a non-`WhenNode` condition) must stay
non-terminal.

## Acceptance criteria

- `fallsThrough` recognises a `CaseNode` with an `else` clause and all-`WhenNode`
  conditions as terminal when every arm (including `else`) is terminal.
- `fallsThrough` recognises a `BeginNode` as terminal when its body and its
  rescue arm (if any) are both terminal, and stays non-terminal for the shapes
  the `BeginNode` handler declines to convert.
- Tests cover a terminal `case`-with-else arm and a terminal `begin`/`rescue`
  arm, each locking that a retraction inside the arm is excluded from the merge.
- `pnpm codegen:score` matched count does not regress; goldens regenerated.
