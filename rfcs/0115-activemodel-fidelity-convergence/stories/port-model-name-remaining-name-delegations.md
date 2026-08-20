---
title: "Port ModelName's remaining delegate-to-name members (===, =~, !~, eql?) and accept a String in match"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6792
claim: "2026-08-20T21:03:53Z"
assignee: "converge-check-validity-hash-readers"
blocked-by: null
closed-reason: null
---

## Context

`ModelName` ports only one of the eight members Rails delegates to `@name`, and
the one it ports rejects an operand Ruby accepts.

`vendor/rails/activemodel/lib/active_model/naming.rb:151-152`:

    delegate :==, :===, :<=>, :=~, :"!~", :eql?, :match?, :to_s,
             :to_str, :as_json, to: :name

`packages/activemodel/src/naming.ts` has `equals` (`==`), `compare` (`<=>`),
`toString` (`to_s`/`to_str`), `asJson` and `match`. Missing: `===`, `=~`, `!~`,
`eql?`. And `match` (naming.rb:112-128 documents `match?`) throws
`ArgumentError("ModelName#match requires a RegExp")` for a String operand,
where Ruby's `String#match?` accepts a String and compiles it as a pattern.

PR #6787 converged `equals` / `compare` onto the delegation and deleted the
hand-written `sameSegments` / `_qualified`; this is the rest of the same
delegate line.

## Acceptance criteria

- `match` accepts a String operand as Ruby `String#match?` does
  (naming.rb:112-128), and stops raising for it. The `lastIndex` save/restore
  for `/g` and `/y` regexps stays — Ruby `match?` is stateless.
- `===` and `eql?` are ported at the trails spelling the conventions table
  produces, delegating to `name` like `equals` does.
- `=~` / `!~` are ported or, if the conventions table produces no spelling for
  them, recorded in `SKIP_GROUPS` in `scripts/parity/conventions.ts` with the
  reason — not left silently absent.
- `pnpm parity:api` delta for activemodel is non-negative;
  `pnpm parity:api:extra --package activemodel` shows `naming.ts` at no more
  than its current 1 novel.
