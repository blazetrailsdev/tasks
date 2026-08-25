---
title: "compare.ts should credit operators with a pinned TS spelling as matched methods"
status: draft
updated: 2026-08-22
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6856 taught `parity:api:extra` to resolve a Ruby OPERATOR to its pinned TS
spelling through `OPERATOR_SPELLING_BY_FQN`
(`scripts/api-compare/operator-order-spelling.ts`), which retired 40 arel extras
(the `Arel::Math` operators from `activerecord/lib/arel/math.rb:5-40` and their
`add` moved rows).

`compare.ts` still does NOT consult that table. `rubyMethodToTs` returns `null`
for every `OPERATORS` member (`scripts/parity/conventions.ts:1478`), so
`dedupeRubyMethodInto` (`compare.ts:2167`) drops each operator from the expected
set entirely. Consequence: a faithfully ported operator earns **no matched-method
credit**, and an unported one is invisible rather than reported missing. Ten
`Arel::Math` methods, `Arel::Table#[]`, `ActiveModel::Errors#[]`, the ~20 `==`
ports listed in the table, and every `[]=` / `<=>` pin are all uncounted today.

PR #6856 deliberately did not fold this in: making compare _expect_ every operator
turns each Ruby `==` with no pinned TS spelling into a NEW miss, which moves
package totals down. The pinned table is the safe subset — an operator with a
verified entry is a real, locatable port.

## Converged shape

Thread the declaring Ruby fqn into the expected-set construction and credit ONLY
operators that have a verified `OPERATOR_SPELLING_BY_FQN` entry; an unpinned
operator keeps today's behavior (dropped, not missing), so no total can fall.

Sites: `dedupeRubyMethodInto` (`compare.ts:2167`, already receives `itemFqn`)
and the per-file match loop (`compare.ts:~3581`, has `rubyModule` in scope).
`mixinMethodCreditedToOwnFile` / `reopeningMethodCreditedToOwnFile`
(`compare.ts:2036`, `:2074`) need the same treatment or `Arel::Math`'s methods
credit to the wrong file.

Guard the direction: `unusedOperatorSpellings()` already reports dead keys, and
the per-package method totals must be non-negative on the run that lands it.

## Acceptance criteria

- `pnpm parity:api` arel matched-method count RISES by the pinned `Arel::Math`
  operators; no package's method or file total falls.
- An operator with no `OPERATOR_SPELLING_BY_FQN` entry is still neither expected
  nor reported missing.
- Tests in `scripts/api-compare/compare.test.ts` for both arms (pinned operator
  credits; unpinned operator stays dropped).
