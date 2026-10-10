---
title: "A value-discarding Hash#delete is a `delete` statement: activerecord, activemodel, activesupport"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: substitution
packages: [activerecord, activemodel, activesupport]
deps: [native-hash-forms-credit-key-delete-merge]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § "Per-name decisions": Ruby `delete` on a plain object ports as the statement `delete h[k]` (or `delete h.k`) **where the removed value is not used**,
and `hashDelete` (`packages/ruby-compat/src/hash.ts`) is kept only where the
site needs an arm JS has no form for. The gate credits the native form once
this story's dependencies have merged; before that the substitution is red on
`parity:api:calls`.

Count with `grep -rnE '(^|[^.A-Za-z_])hashDelete\(' packages/<pkg>/src --include=*.ts`. The figures below are lines at trails `ddd629745a` (2026-10-10) and include `.hashDelete(` method calls on ported classes, which are not helper calls and stay.

| Package       | Lines |
| ------------- | ----- |
| activerecord  | 19    |
| activemodel   | 2     |
| activesupport | 2     |

`@fixture_cache[fs_name].delete(f_name)` (`activerecord/lib/active_record/test_fixtures.rb:307`) is the case `scripts/parity/ruby-compat.ts:221-223` documents as crediting through `hashDelete` on an unproven receiver; check what its port's receiver is before touching it.

Ruby's `Hash#delete` returns the stored value (`rb_hash_delete_m`,
`vendor/ruby/v3.3.11/hash.c:2441`); JS's `delete` answers a boolean. Across the
repo 19 of the 97 `hashDelete(` call sites are a bare statement and 78 use the
value (`const pub = hashDelete(options, "public")`). Only the bare statements
are candidates, unless RFC open question 3 is answered otherwise. Of those, a
site stays when its receiver can be a `Map` / `Hash`, when it passes the block
arm, or when a Rails test asserts the `FrozenError` the helper raises on a
frozen receiver (`hash.ts:379-381`): a native `delete` on a frozen object
raises `TypeError` in a module.

## Acceptance criteria

- [ ] Every `hashDelete(` call in the packages above (source and test files) is
      either replaced by the native form or listed in the PR body as staying,
      with the reason from the RFC's § "Per-name decisions" and the Rails
      `file:line` the site ports.
- [ ] Each replaced site was checked against its Rails body. The check is
      about what the receiver can be and what the site does with the result,
      not about the name.
- [ ] No test title changes: `git diff origin/main...HEAD -- '*.test.ts' |
  grep -E '^[-+].*\b(it|test|describe)\('` is empty.
- [ ] An import of `hashDelete` with no remaining use in its file is removed.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:arms:throws` and
      `pnpm parity:api:extra:gate` green with no baseline row and no
      `@missingRailsCall` / `@missingRailsArgs` receipt added. A row that goes
      stale is deleted by hand and tightened.
- [ ] The touched test files pass (`pnpm vitest run <file>`); the full suite is
      CI's.
- [ ] The PR body gives the before and after line counts for `hashDelete` in
      these packages.

## Definition of done

A regex or codemod sweep does not close this story: each site is edited by hand
after reading the Rails body it ports. A new baseline row, `@missingRailsCall`
or `@missingRailsArgs` receipt does not close it either. A site left on the
helper for a reason in the RFC's § "Per-name decisions" is a correct outcome,
and is listed in the PR body with that reason.
