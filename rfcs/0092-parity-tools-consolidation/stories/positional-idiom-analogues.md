---
title: "Decide whether the call gate can credit positional/property idioms (first/last/any?/size)"
status: done
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: ["enumerable-idioms-match-test"]
deps-rfc: []
est-loc: 250
priority: null
pr: 6269
claim: "2026-08-09T01:24:25Z"
assignee: "enroll-pg-and-mysql-rake-tests-in-test-compare"
blocked-by: null
closed-reason: null
---

## Context

The `parity:api:calls` triage audit of 2026-08-08 rates this the single
highest-leverage change available to all 1,904 unreviewed rows: 173
activerecord rows (its largest idiom class) are Enumerable/positional idioms
whose faithful port is a JS _property or index_, not a call — `xs.any?` →
`xs.length > 0`, `xs.first` → `xs[0]`, `xs.last` → `xs.at(-1)`, `xs.size` →
`xs.length`. `first`(36), `any?`(28), `include?`(12), `last`(10), `size`(9)
alone are 95 rows across five names, and a scripted check finds `.length` /
`[0]` / `.at(` in 72 of the 173 TS bodies. Converging them deletes rows instead
of writing ~90 reason texts, and the comparator applies the tables to every
package at once.

**This story exists to answer a design question, and may legitimately resolve
as "no change".** Two obstacles are real and must be confronted before any
table edit:

1. **Mechanism.** `JS_ENUMERABLE_ALIASES` maps call → call. A property analogue
   (`length`) is not a call name, so crediting `any?` from `xs.length > 0`
   plausibly needs the `NO_JS_CALL_FORM` route instead
   (`compare.ts:189-197`, where `present?` / `blank?` / `to_s` / `each` already
   live), or a small property-analogue table beside it. The audit did not test
   either and files this as its Open Question 1. Note the two mechanisms have
   different blast radii: an alias is consulted only when deciding whether a TS
   body already makes a call, whereas `NO_JS_CALL_FORM` membership suppresses
   the Ruby call from the gate entirely, for every receiver.

2. **An existing, deliberate guardrail says no.** `compare.ts`'s
   `NO_JS_CALL_FORM` block carries a "DELIBERATELY NOT suppressed" comment
   naming exactly `size`, `empty?`, `first`, `last`: on an
   `ActiveRecord::Relation` or association receiver these are real
   query-triggering methods — `Relation#size` is
   `loaded? ? records.length : count(:all)`, `#first`/`#last` dispatch to
   `find_nth_with_limit` / `find_last` (trails ports these as
   `performFirst`/`performLast`). A single global set has no receiver-type
   distinction, so suppressing them would make a port that rewrote a relation
   `.first` into indexing a preloaded array — dropping the query trigger —
   permanently invisible to the gate. That is the fidelity gap the gate exists
   to catch. `any?` is the same shape (`Relation#empty?`/`#any?` hit the DB).

So the work is: decide whether the comparator can distinguish an Array/Hash
receiver from a Relation/association receiver at the point the gate runs, and
only then decide the mechanism. If receiver typing is not available, the honest
outcome is to record that finding, leave the tables alone, and close this story
— routing the ~90 rows to bulk reason texts instead (which is triage labour
under the audit's plan, not tooling). Do not weaken the guardrail to harvest
rows.

Respect the alias table's stated contract either way: "each alias must be the
WHOLE call's analogue". `first` → `[0]` satisfies it; `map` → a `for`-of loop
does not, and belongs on the `NO_JS_CALL_FORM` side if anywhere.

Depends on `enumerable-idioms-match-test`, which lands the uncontroversial
`match?` pair in the same file first; keeping them separate stops this
story's open question from blocking that convergence.

## Acceptance criteria

- A written determination, in the PR body and as a comment in the touched
  file(s), of whether the comparator can distinguish Array/Hash receivers from
  Relation/association receivers for `first`/`last`/`any?`/`size` — with the
  evidence, not an assertion.
- If it can: the property-analogue mechanism implemented (new membership set or
  a property table beside `JS_ENUMERABLE_ALIASES`), unit-tested, with the
  receiver restriction enforced in code and the existing "DELIBERATELY NOT
  suppressed" comment updated rather than deleted.
- If it cannot: no table change; the story closes with the finding recorded in
  `enumerable-idioms.ts` / `compare.ts` so the next reader does not re-derive
  it, and the affected rows are explicitly handed to the reason-text route.
- Any baseline shrinkage is committed through `pnpm parity:api:calls:reseed`, never a
  hand edit of the exclude JSON, and `pnpm parity:api:calls` ends green with zero mark
  slack.
- No row converges whose TS body dropped a query trigger — spot-check at least
  five converged Relation-receiver candidates by hand and record them.

## Audit addendum (auditor, 2026-08-08)

Three numbers the original audit could not supply, added after re-reading
`compare.ts:177-188` (the "DELIBERATELY NOT suppressed" comment this story is
built on — it is real, and it names `size`, `empty?`, `first`, `last`
explicitly, plus `delete` / `merge` / `fetch` in its last sentence).

**The contamination this story exists to prevent is small, but non-zero.**
Scanning the Ruby call-site line of all 95 rows for the five names, with a
relation-ish receiver token (`relation`, `scope`, `records`, `all`, `klass.`,
`model.`, `target_scope`, `association`, `current_scope`) as the proxy:

| call       | rows | relation-ish receiver |
| ---------- | ---: | --------------------: |
| `first`    |   36 |                     2 |
| `any?`     |   28 |                     4 |
| `include?` |   12 |                     0 |
| `last`     |   10 |                     1 |
| `size`     |    9 |                     0 |
| **total**  |   95 |                 **7** |

So ~93% of the population is an Array/Hash receiver. That does **not** license
suppressing the names globally — the 7 are exactly the rows whose loss the
comment warns about, and a token proxy is crude in both directions — but it does
mean "receiver typing is unavailable, therefore close the story" leaves ~88
convergeable rows on the table. If the determination lands on "cannot
distinguish", consider a third outcome the acceptance criteria do not currently
offer: a **per-row** receiver check done once (by the `--set-reason` predicate
machinery from the sibling story, which already needs a Rails-manifest join to
reach the call-site line) rather than a global set membership. That keeps the
guardrail intact — nothing is suppressed for every receiver — while still
retiring the 88.

`empty?` contributes **zero** activerecord unreviewed rows, so it can be dropped
from this story's scope regardless of the outcome.
