---
title: "inflections-irregular-arms-and-uncountables-class"
status: draft
updated: 2026-08-12
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while burning down RFC 0096 wave-2 naming rows in
`packages/activesupport/src/inflector/inflections.ts`.

Two a3 findings, both in the same cluster:

1. **`Inflections#irregular` drops four of Rails' `singular` calls.**
   `vendor/rails/activesupport/lib/active_support/inflector/inflections.rb:...`
   `irregular` — the `s0.upcase == p0.upcase` branch emits **two** `plural`
   and **two** `singular` rules (`/(#{s0})#{srest}$/i` and
   `/(#{p0})#{prest}$/i`); the `else` branch emits **four** `plural` and
   **four** `singular` rules. trails
   (`packages/activesupport/src/inflector/inflections.ts:57-77`) emits only
   **one** `singular` rule in the first branch and **two** in the second, so
   the `s0`-keyed singular rules are missing entirely. A word registered via
   `irregular` whose singular form differs in first-letter case from the
   plural will not singularize back.

2. **`Inflections::Uncountables` is not ported.** Rails' `@uncountables` is
   an `Uncountables < Array` whose `delete`/`<<`/`add` downcase their
   argument (inflections.rb, `class Uncountables`). trails uses a plain
   `Set<string>` and inlines `.toLowerCase()` at each call site
   (`inflections.ts:41,44,50,53,58,59,83`), which is what makes seven
   RFC 0096 `naming` rows (`delete` / `add` receiving `ref:toLowerCase`
   where Rails passes `ref:rule` / `ref:replacement` / `ref:singular` /
   `ref:plural` / `ref:words`) unfixable by renaming.

Porting `Uncountables` retires all seven rows and removes the inlined
downcasing; fixing `irregular` is an independent behavioural fix in the
same file.

## Acceptance criteria

- [ ] `Inflections#irregular` emits the same set of `plural`/`singular` rules
      as `inflections.rb`, in the same order, in both branches.
- [ ] `ActiveSupport::Inflector::Inflections::Uncountables` is ported with its
      Rails name and case-folding `add`/`delete`/`<<`, and `inflections.ts`
      call sites pass the raw identifier (no inline `.toLowerCase()`).
- [ ] `pnpm parity:api:calls:args:report` shows the seven
      `inflector/inflections.ts` `naming` rows gone, with no new `shape` rows.
- [ ] A regression test covers an `irregular` pair whose singular and plural
      differ in first-letter case; it fails on baseline.
