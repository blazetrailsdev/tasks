---
title: "Hash#[] and Hash#[]= on a plain object are element access: activerecord, actionpack, activesupport, arel"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: substitution
packages: [activerecord, actionpack, activesupport, arel]
deps:
  [
    native-hash-delete-sites-actionpack-trailties-rack-test,
    native-hash-delete-sites-activerecord-activemodel-activesupport,
    native-hash-element-access-credits-aref-aset,
  ]
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

RFC § "Per-name decisions": Ruby `[]` / `[]=` on a plain object ports as `h[k]` and `h[k] = v`,
and `hashAref` (`packages/ruby-compat/src/hash.ts`) is kept only where the
site needs an arm JS has no form for. The gate credits the native form once
this story's dependencies have merged; before that the substitution is red on
`parity:api:calls`.

Count with `grep -rnE '(^|[^.A-Za-z_])hashAref\(' packages/<pkg>/src --include=*.ts`. The figures below are lines at trails `ddd629745a` (2026-10-10) and include `.hashAref(` method calls on ported classes, which are not helper calls and stay.

| Package       | `hashAref` | `hashAset` |
| ------------- | ---------- | ---------- |
| activerecord  | 8          | 4          |
| activesupport | 4          | 1          |
| actionpack    | 3          | 3          |
| arel          | 0          | 1          |

This story covers `hashAset(` as well as `hashAref(`; apply every criterion to both names. Test files hold 53 more `hashAref(` occurrences repo-wide, 20 in ruby-compat's own tests, which stay, and the rest in activemodel (9 files) and activerecord (3 files) tests, which ride with the story for their package.

`hashAref` answers `null` for a miss, a `Hash`'s default, a non-Hash receiver's
`get`, and refuses an inherited `Object.prototype` member (`hash.ts:406-424`).
`hashAset` sends a non-Hash receiver its `set`, writes a `Map`, raises
`FrozenError` on a frozen receiver and defines `"__proto__"` as an own data
property (`hash.ts:433-456`). A native `h[k]` answers `undefined` on a miss and
`Object.prototype.constructor` for `"constructor"`. So a site converts only
when its receiver is statically a plain object, its key is a literal or
otherwise cannot name a prototype member, and nothing downstream tells `null`
from `undefined` (`x != null` does not; `x === null` and `rbInspect(x)` do).

## Acceptance criteria

- [ ] Every `hashAref(` call in the packages above (source and test files) is
      either replaced by the native form or listed in the PR body as staying,
      with the reason from the RFC's § "Per-name decisions" and the Rails
      `file:line` the site ports.
- [ ] Each replaced site was checked against its Rails body. The check is
      about what the receiver can be and what the site does with the result,
      not about the name.
- [ ] No test title changes: `git diff origin/main...HEAD -- '*.test.ts' |
grep -E '^[-+].*\b(it|test|describe)\('` is empty.
- [ ] An import of `hashAref` with no remaining use in its file is removed.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:arms:throws` and
      `pnpm parity:api:extra:gate` green with no baseline row and no
      `@missingRailsCall` / `@missingRailsArgs` receipt added. A row that goes
      stale is deleted by hand and tightened.
- [ ] The touched test files pass (`pnpm vitest run <file>`); the full suite is
      CI's.
- [ ] The PR body gives the before and after line counts for `hashAref` in
      these packages.

## Definition of done

A regex or codemod sweep does not close this story: each site is edited by hand
after reading the Rails body it ports. A new baseline row, `@missingRailsCall`
or `@missingRailsArgs` receipt does not close it either. A site left on the
helper for a reason in the RFC's § "Per-name decisions" is a correct outcome,
and is listed in the PR body with that reason.
