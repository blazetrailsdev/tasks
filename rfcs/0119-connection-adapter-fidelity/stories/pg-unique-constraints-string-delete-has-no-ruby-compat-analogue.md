---
title: "String#delete has no ruby-compat analogue, leaving the last pg schema-statements call row"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`unique_constraints` builds its `conkey` list with
`row["conkey"].delete("{}").split(",").map(&:to_i)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:709`).
The port spells that `String(r.conkey).replace(/[{}]/g, "").split(",").map(Number)`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts:1109`).

This is the last surviving row in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/postgresql/schema-statements.json`.
PR #7531 converged the other five onto analogues trails already had (`valuesAt`,
`compactBlank`, `first`, `wrap`); this one had no counterpart to reach for —
`@blazetrails/ruby-compat` has no `String#delete`, and `packages/activesupport/src/string-utils.ts`
has `first`/`last`/`exclude` but nothing for it.

`String#delete` is a real Ruby builtin with non-trivial semantics: the argument is
a character SET, not a substring, and multiple arguments intersect. A faithful
port only needs the single-argument set form for this call site, but should not
be written as a substring removal, which is what `replace(/[{}]/g, "")` happens
to coincide with only because the set is two distinct characters.

## Converged shape

Add `delete` to ruby-compat's String surface next to the existing helpers, with
Ruby's character-set semantics (`c1-c2` ranges and a leading `^` negation, per
`String#delete`), call it from `unique_constraints`, and hand-delete the baseline
row plus
`pnpm parity:api:calls:tighten activerecord/connection-adapters/postgresql/schema-statements.json`.

## Acceptance criteria

- [ ] `String#delete` exists in `@blazetrails/ruby-compat` with character-set
      semantics, covered by tests taken from MRI behaviour (`ruby` is on PATH).
- [ ] `unique_constraints` calls it instead of `replace(/[{}]/g, "")`.
- [ ] The `unique_constraints` / `delete` baseline row is deleted; the file's
      row count reaches 0 and the mark is tightened.
