---
title: "Sweep the remaining AR test-file association scopes onto Rails' positional"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6509
claim: "2026-08-14T09:27:06Z"
assignee: "test-files-scope-positional-sweep"
blocked-by: null
closed-reason: null
---

## Context

PR #6502 (`models-scope-positional-sweep`) converted all 174 options-bag
`scope:` association declarations in
`packages/activerecord/src/test-helpers/models/**` onto Rails' positional
lambda (`associations.rb:1302,1870`), matching the
`vendor/rails/activerecord/test/models/*.rb` line in each case.

It deliberately stopped at the canonical models. Roughly 73 options-bag
`scope:` callers remain in AR **test files** — classes declared inline in
`*.test.ts` rather than in `test-helpers/models/`:

```bash
grep -rn "scope: (" packages/activerecord/src --include=*.ts | grep -v test-helpers/models
```

Two of them (`associations.test.ts` `parrotsWithAnnotation`,
`has-and-belongs-to-many-associations.test.ts`
`ProjectUnscopingDavidDefaultScope#developers`) were converted by #6502 because
they were the last callers feeding the HABTM builder's options bag; the rest
were left.

Every one of these is the same trails-only spelling with no Rails counterpart —
Rails writes the scope as the positional lambda at every one of these sites,
e.g. `has_and_belongs_to_many :developers, -> { unscope(where: :name) }, ...`.
Leaving them means the two spellings still coexist in the tree, which is the
"copy the shape next to you" trap.

This is the prerequisite for `drop-builder-association-scope-option-shim`:
`Builder::Association` cannot stop accepting `scope:` in the options bag until
no caller feeds it.

## Converged shape

`this.hasMany("x", (q) => ..., { className: "Y" })` — Rails' positional, for
every `hasMany` / `hasOne` / `belongsTo` / `hasAndBelongsToMany` declaration in
an AR test file. Where the inline class mirrors a Rails test-file class, match
that Rails declaration; where it has no Rails counterpart, still use the
positional.

## Acceptance criteria

- [ ] `grep -rn "scope: (" packages/activerecord/src --include=*.ts` returns
      nothing outside unrelated uses (`validatesUniqueness({ scope: ... })`,
      parameter names).
- [ ] `pnpm parity:api:calls:args` stays green with no new rows.
- [ ] The touched suites stay green.
