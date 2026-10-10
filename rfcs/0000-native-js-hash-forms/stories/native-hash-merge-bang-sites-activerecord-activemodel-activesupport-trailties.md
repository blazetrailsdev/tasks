---
title: "merge! on a plain object is Object.assign: activerecord, activemodel, activesupport, trailties"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: substitution
packages: [activerecord, activemodel, activesupport, trailties, ruby-compat]
deps:
  [
    native-hash-key-sites-activerecord-activemodel,
    native-hash-key-sites-trailties-activesupport-actionview,
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

RFC § "Per-name decisions": Ruby `merge!` on a plain object ports as `Object.assign(h, other)`,
and `mergeBang` (`packages/ruby-compat/src/hash.ts`) is kept only where the
site needs an arm JS has no form for. The gate credits the native form once
this story's dependencies have merged; before that the substitution is red on
`parity:api:calls`.

Count with `grep -rnE '(^|[^.A-Za-z_])mergeBang\(' packages/<pkg>/src --include=*.ts`. The figures below are lines at trails `ddd629745a` (2026-10-10) and include `.mergeBang(` method calls on ported classes, which are not helper calls and stay.

| Package                         | Lines |
| ------------------------------- | ----- |
| activerecord                    | 17    |
| trailties                       | 11    |
| activesupport                   | 10    |
| activemodel                     | 9     |
| ruby-compat (outside `hash.ts`) | 1     |

`mergeBang` is `update` (`hash.ts:328`): it takes several arguments, a trailing
conflict block (`rb_hash_update_block_i`), and a `Map` on either side
(`hash.ts:301-321`). No non-test site passes a `block(...)` inline today, but a
block held in a variable would not show in a grep, so read each site. A site
whose receiver or argument can be a `Hash` / `Map` stays, or calls the
receiver's own method when the static type is that alone. `.mergeBang(` on a
ported class (`Parameters#merge!`, HWIA) is a Rails member and is not a helper
call.

## Acceptance criteria

- [ ] activesupport's own `merge` / `mergeBang` wrappers
      (`packages/activesupport/src/hash-utils.ts:114-121`, a bare spread and a
      bare assign tagged `@noRailsEquivalent PERMANENT`) are deleted and their
      importers (5 files at trails `ddd629745a`) write the spread or
      `Object.assign` directly, or import ruby-compat's `merge` / `update`
      where a conflict block or a `Map` is involved. This is what remains of
      `activesupport-hash-utils-merge-retires-onto-ruby-compat-hash-merge`.

- [ ] Every `mergeBang(` call in the packages above (source and test files) is
      either replaced by the native form or listed in the PR body as staying,
      with the reason from the RFC's § "Per-name decisions" and the Rails
      `file:line` the site ports.
- [ ] Each replaced site was checked against its Rails body. The check is
      about what the receiver can be and what the site does with the result,
      not about the name.
- [ ] No test title changes: `git diff origin/main...HEAD -- '*.test.ts' |
grep -E '^[-+].*\b(it|test|describe)\('` is empty.
- [ ] An import of `mergeBang` with no remaining use in its file is removed.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:arms:throws` and
      `pnpm parity:api:extra:gate` green with no baseline row and no
      `@missingRailsCall` / `@missingRailsArgs` receipt added. A row that goes
      stale is deleted by hand and tightened.
- [ ] The touched test files pass (`pnpm vitest run <file>`); the full suite is
      CI's.
- [ ] The PR body gives the before and after line counts for `mergeBang` in
      these packages.

## Definition of done

A regex or codemod sweep does not close this story: each site is edited by hand
after reading the Rails body it ports. A new baseline row, `@missingRailsCall`
or `@missingRailsArgs` receipt does not close it either. A site left on the
helper for a reason in the RFC's § "Per-name decisions" is a correct outcome,
and is listed in the PR body with that reason.
