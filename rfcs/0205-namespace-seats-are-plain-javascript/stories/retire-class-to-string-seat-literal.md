---
title: "retire-class-to-string-seat-literal"
status: draft
updated: 2026-11-13
rfc: "0205-namespace-seats-are-plain-javascript"
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

`blazetrails/class-to-string-seat` (`eslint/class-to-string-seat.mjs`, enrolled
for activejob and activesupport in `eslint.config.mjs`) writes a
`static toString(): string { return "<Ruby path>"; }` literal on each class, so
that `` `${klass}` `` renders the Ruby path instead of
`Function.prototype.toString`'s source text. The generated constant table
(`packages/<pkg>/lib/constants.generated.ts`, `pnpm parity:class-paths`) now
answers every paired class's path through `rbModName`, and `rbModToS`
(`packages/ruby-compat/lib/object.ts:516-539`) reads `classpaths`, the own
`toString`, then `rbModName`. The literal duplicates the table.

The operator ruled (2026-11-13, on the
`decide-class-to-string-literal-against-generated-path-table` story) to retire
the literal. Ruby's `"#{klass}"` is `rb_mod_to_s`
(`vendor/ruby/v3.3.11/object.c:1710-1742`); the port of that interpolation is
`` `${rbModToS(klass)}` ``.

## Acceptance criteria

- [ ] Every `` `${klass}` `` / `String(klass)` site in activejob and
      activesupport that relies on the literal reads `rbModToS(klass)` instead.
- [ ] The `static toString()` literals the rule wrote in activejob and
      activesupport are deleted, and `rbModToS`'s own-`toString` arm is kept
      only for a hand-ported Ruby `def self.to_s`.
- [ ] `eslint/class-to-string-seat.mjs`, its test, and its registration and
      enrollment in `eslint.config.mjs` are deleted.
- [ ] The class-paths regression tests still answer each class's Ruby path.
