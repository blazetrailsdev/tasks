---
title: "Drive async body inference off the Prism AST, not a textual def scan"
status: closed
updated: 2026-08-05
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
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

PR #5821 added `inferAsyncFromBodies` / `rubyDefBodies`
(`scripts/prism-codegen/async-source.ts`), which give an unported Rails file
its async markings by scanning what each `def` body calls. The body split is
**textual**, not a parse: it pairs a `def` with the `end` at its own column,
then strips comments and string literals before tokenizing.

That leaves three known gaps, documented in the honesty list at
`docs/infrastructure/prism-codegen-spike.md` (limits item 3):

- Ruby endless methods (`def name(args) = expr`) have no `end`, so the closer
  scan runs forward to the next same-indent `end` and merges unrelated method
  bodies. The vendored corpus has zero such defs today (verified by grep over
  `activerecord`/`activesupport`/`activemodel` lib trees), so this is latent,
  not live — but it is silent when it does fire.
- Heredoc bodies are not stripped, so a name mentioned in a heredoc reads as a
  call.
- Metaprogrammed names (`send(:perform_save)`) read as calls to
  `perform_save`.

The failure mode is a def marked `async` that emits no `await`, and the
fixpoint propagates that marking to its same-file callers.

The codegen already has the Prism AST for the file at generation time
(`generateFromSource`); the async-source pass predates it and re-reads the
Ruby as text. Driving def bodies off the AST instead of the column heuristic
would close all three at once.

## Acceptance criteria

- Def bodies for the inference pass come from the Prism AST, not a
  column-matched text scan.
- Endless-method defs are attributed to their own body only, with a test.
- A name appearing only in a heredoc does not mark its def async, with a test.
- The existing string-literal/interpolation and single-line-def tests in
  `scripts/prism-codegen/codegen.test.ts` keep passing unchanged.
- `pnpm codegen:score` matched count does not regress; generated output for
  the current targets stays byte-identical.
