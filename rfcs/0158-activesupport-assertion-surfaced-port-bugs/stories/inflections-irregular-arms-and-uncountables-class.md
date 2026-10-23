---
title: "Inflections#irregular emits only some of Rails' singular rules"
status: draft
updated: 2026-08-12
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages:
  - "activesupport"
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Refinement (2026-10-22)

Re-verified against trails `origin/main` when 0023 was retired. Uncountables half landed (#6513); irregular still emits 1 of 2 / 2 of 4 singular rules (inflections.ts). Where this note and the original text below disagree, the note is current; the acceptance criteria apply to what remains.

## Context

Surfaced while burning down RFC 0096 wave-2 naming rows in
`packages/activesupport/src/inflector/inflections.ts` (PR #6433).

**`Inflections#irregular` drops four of Rails' `singular` calls.**
`vendor/rails/v8.0.2/activesupport/lib/active_support/inflector/inflections.rb`,
`def irregular(singular, plural)`:

- the `s0.upcase == p0.upcase` branch emits **two** `plural` rules
  (`/(#{s0})#{srest}$/i`, `/(#{p0})#{prest}$/i`) and **two** `singular` rules
  (the same two patterns, replacing with `'\1' + srest`);
- the `else` branch emits **four** `plural` and **four** `singular` rules
  (upcase/downcase of `s0` and of `p0`).

trails (`packages/activesupport/src/inflector/inflections.ts:57-77`) emits only
**one** `singular` rule in the first branch (`inflections.ts:69`) and **two** in
the second (`inflections.ts:75-76`). The `s0`-keyed singular rules are missing
in both, so an irregular pair whose singular and plural differ in first-letter
case does not singularize back.

Converged shape: emit exactly the rule set `inflections.rb#irregular` emits, in
Rails' order, in both branches.

Scope note: the seven RFC 0096 `naming` rows in this file (`delete` / `add`
receiving `ref:toLowerCase` where Rails passes `ref:rule`, `ref:replacement`,
`ref:singular`, `ref:plural`, `ref:words`) come from inlining `Uncountables`'
case-folding `delete`/`add` at each call site. That is
[[port-inflections-uncountables-collection]]'s job, not this one — this story
is the `irregular` rule set only.

## Acceptance criteria

- [ ] `Inflections#irregular` emits the same `plural`/`singular` rules as
      `inflections.rb#irregular`, in the same order, in both branches.
- [ ] A regression test covers an `irregular` pair whose singular and plural
      differ in first-letter case (round-trips `pluralize` → `singularize`);
      it fails on baseline.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
