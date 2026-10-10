---
title: "Hash#each_pair on a plain object is a for…of over Object.entries: every package"
status: draft
updated: 2026-10-10
rfc: "0190-native-js-hash-forms"
cluster: substitution
packages: [actionpack, trailties, activerecord, activesupport, actionview, ruby-compat]
deps:
  [
    native-hash-aref-aset-sites-activemodel,
    native-hash-aref-aset-sites-activerecord-actionpack-activesupport-arel,
    native-hash-delete-sites-actionview,
    native-hash-each-pair-entries-loop-credit,
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § "Per-name decisions": Ruby `each_pair` on a plain object ports as `for (const [k, v] of Object.entries(h))`,
and `eachPair` (`packages/ruby-compat/src/hash.ts`) is kept only where the
site needs an arm JS has no form for. The gate credits the native form once
this story's dependencies have merged; before that the substitution is red on
`parity:api:calls`.

Count with `grep -rnE '(^|[^.A-Za-z_])eachPair\(' packages/<pkg>/src --include=*.ts`. The figures below are lines at trails `ddd629745a` (2026-10-10) and include `.eachPair(` method calls on ported classes, which are not helper calls and stay.

| Package       | Lines |
| ------------- | ----- |
| actionpack    | 11    |
| trailties     | 9     |
| activerecord  | 6     |
| activesupport | 5     |
| actionview    | 4     |
| ruby-compat   | 4     |

Nine of the 40 occurrences are `.eachPair(` on a ported class and stay.

`eachPair` sends a non-Hash receiver its own `each`, walks a `Map`, and
returns the receiver (`hash.ts:522-540`). A site stays when the receiver can be
either of those or when the returned receiver is used. A block that `return`s
early from the Ruby method is the reason to prefer the loop: check that a
`return` inside the old callback was a `next` and not a method return before
moving it into a loop body, where it would become one.

`persistence.ts:658` (`update_columns`,
`activerecord/lib/active_record/persistence.rb:616`) is also edited by
`native-hash-string-keyed-carriers-to-plain-objects`; which depends on this story.

## Acceptance criteria

- [ ] Every `eachPair(` call in the packages above (source and test files) is
      either replaced by the native form or listed in the PR body as staying,
      with the reason from the RFC's § "Per-name decisions" and the Rails
      `file:line` the site ports.
- [ ] Each replaced site was checked against its Rails body. The check is
      about what the receiver can be and what the site does with the result,
      not about the name.
- [ ] No test title changes: `git diff origin/main...HEAD -- '*.test.ts' |
grep -E '^[-+].*\b(it|test|describe)\('` is empty.
- [ ] An import of `eachPair` with no remaining use in its file is removed.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:arms:throws` and
      `pnpm parity:api:extra:gate` green with no baseline row and no
      `@missingRailsCall` / `@missingRailsArgs` receipt added. A row that goes
      stale is deleted by hand and tightened.
- [ ] The touched test files pass (`pnpm vitest run <file>`); the full suite is
      CI's.
- [ ] The PR body gives the before and after line counts for `eachPair` in
      these packages.

## Definition of done

A regex or codemod sweep does not close this story: each site is edited by hand
after reading the Rails body it ports. A new baseline row, `@missingRailsCall`
or `@missingRailsArgs` receipt does not close it either. A site left on the
helper for a reason in the RFC's § "Per-name decisions" is a correct outcome,
and is listed in the PR body with that reason.
