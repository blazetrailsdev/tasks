---
title: "Lowering for expressions and control flow, the decline machinery and the one-shot driver: first typechecking output"
status: draft
updated: 2026-10-07
rfc: "0000-ruby-ts-codegen"
cluster: tooling
packages: []
deps: [codegen-resolver-and-resolution-report, codegen-hint-pipeline]
deps-rfc: []
est-loc: 2100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Decision 3 of this RFC: every emitted file typechecks, and statements the
generator cannot resolve are declined with an explicit marker. This story
delivers the first end-to-end run: `pnpm codegen activejob` emits a
TypeScript tree that passes `tsc`, with mixins, `super` and awaits still
declined (story 5 lowers those).

Lowering is one function per IR node kind, reading the IR and the side
tables from story 2. Names come from `rubyMethodToTs` and locals keep the
Rails identifier camelCased; paths from `rubyFileToTs`. The semantic nodes
lower by the rules in the README's Design table; each rule has a test.
Idioms worth calling out because the retired generator got them wrong:
Ruby's unary `+` on a string is identity, not numeric coercion; `<<` on an
array is `push` but on a string is `StrMutate`; `is_a?(Symbol)` is the
`typeof` image of a string because a Ruby Symbol is a JS string.

The decline marker:

```ts
declined<T = unknown>(site: string, reason: DeclineReason, ruby: string): T
```

It typechecks in statement, value and tail position, throws at run time,
carries the Ruby source as a string argument (the `no-freeform-comments`
lint strips prose comments), and takes one of the closed reason codes listed
in the README. A declined def keeps its real signature. The typecheck
guarantee is a loop: emit, run the checker, map each diagnostic to its
enclosing statement, re-emit that statement as
`declined(…, "tsc-diagnostic", …)`, repeat; a def that still fails has its
body declined whole. A declined value is typed `unknown`, so dependents
decline too; that cascade is the honest behaviour and is counted in the
report.

The driver is one-shot: it writes the tree, runs prettier, and prints the
report (per-file resolution buckets, decline counts by reason, the ruby-compat
wanted list). It skips any file whose trails twin already exists in the
target package, so a done RFC 0169 story is never overwritten.

## Acceptance criteria

- [ ] Lowering functions for literals, locals, calls, kwargs (the settled
      options idiom, with "passed as nil" distinct from "absent"), blocks and
      the trailing `block` parameter, returns, `if`/`unless`/`case`/loops,
      `begin`/`rescue`/`ensure`, op-assign, string interpolation, and every
      semantic node in the Design table, each with a unit test.
- [ ] `scripts/codegen/declined.ts` template and the reason-code set; the
      diagnostic-driven re-emit loop with a test that injects a deliberately
      unresolvable statement and shows the file still typechecks.
- [ ] `pnpm codegen <gem> --out <dir>` emits the tree, runs prettier, writes
      `report.json` and prints the summary.
- [ ] A test runs the generator over `vendor/rails/v8.0.2/activejob/lib`
      into a temp directory and runs `tsc` on the result with the repo's
      strict options; it passes.
- [ ] The report's decline counts by reason are recorded in the PR body as
      the baseline story 5 is measured against.
- [ ] The `declined` helper file is confirmed not to count toward
      `parity:api:extra` (it has no Rails-matched file); if it does, the
      story records how it is excluded.

## Verification

`pnpm codegen activejob --out /tmp/aj && pnpm exec tsc -p /tmp/aj` is green,
and `pnpm vitest run scripts/codegen`.
