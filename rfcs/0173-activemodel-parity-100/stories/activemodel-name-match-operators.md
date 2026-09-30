---
title: "activemodel: port ActiveModel::Name's =~ / !~ delegation instead of scoping them out"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: skips
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SCOPED_SKIP_GROUPS[0]` (`scripts/parity/conventions.ts`) drops `ActiveModel::Name#=~` and `#!~`
(`delegate ... :=~, :!~, to: :name`, `vendor/rails/v8.0.2/activemodel/lib/active_model/naming.rb:151-152`) on the grounds that nothing in trails
consumes a match offset. That is a scoring argument, not a TypeScript shortcoming: trails already
spells Ruby operators through `OPERATOR_SPELLING_BY_FQN` (`scripts/api-compare/operator-order-spelling.ts:29`;
e.g. `Duration#-@` → `negate`), and `String#=~`'s offset (`string.c` `rb_str_match`) is an ordinary
value a port can return.

## Acceptance criteria

- [ ] `=~` and `!~` get spellings in `OPERATOR_SPELLING_BY_FQN` (with the `scripts/` test that asserts the unmapped set updated — see the memory note on that test) and are ported on `Name` as delegations to its string, answering the Integer offset / its negation.
- [ ] `SCOPED_SKIP_GROUPS[0]` is deleted; `docs/ruby-ts-conventions.md` regenerated.
- [ ] `pnpm parity:api` activemodel denominator `scoped skip` 1 → 0 for naming.rb.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
