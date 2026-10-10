---
title: "key? on a plain object is `in` / Object.hasOwn: activerecord, activemodel"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: substitution
packages: [activerecord, activemodel]
deps: [native-hash-forms-credit-key-delete-merge]
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

RFC § "Per-name decisions": Ruby `key?` on a plain object ports as `k in h` for a literal key that is not an `Object.prototype` member name, or `Object.hasOwn(h, k)` for a computed or caller-supplied key,
and `hasKey` (`packages/ruby-compat/src/hash.ts`) is kept only where the
site needs an arm JS has no form for. The gate credits the native form once
this story's dependencies have merged; before that the substitution is red on
`parity:api:calls`.

Count with `grep -rnE '(^|[^.A-Za-z_])hasKey\(' packages/<pkg>/src --include=*.ts`. The figures below are lines at trails `ddd629745a` (2026-10-10) and include `.hasKey(` method calls on ported classes, which are not helper calls and stay.

| Package      | Lines |
| ------------ | ----- |
| activerecord | 30    |
| activemodel  | 11    |

Test files add about 36 helper calls across the two packages, most of them in activemodel.

`hasKey` reads a plain object's `undefined`-valued property as an absent key
(`hash.ts:181-185`, `:194-196`), because a caller forwarding an absent keyword writes
`{ name: undefined }`. `in` and `Object.hasOwn` read it as present. A site
whose object can arrive that way stays on `hasKey`. So does a site whose
receiver can be a `Map`, a `Hash`, or a class answering `isKey`
(`ActiveRecord::Result::IndexedRow`, `hash.ts:177-181`); where the static type
is one of those alone, call its own method (`map.has(k)`, `row.isKey(k)`).

`values.key?(name)` in `AttributeSet::Builder` (`activemodel/lib/active_model/attribute_set/builder.rb:33`) is the dispatching case the helper documents and stays.

## Acceptance criteria

- [ ] Every `hasKey(` call in the packages above (source and test files) is
      either replaced by the native form or listed in the PR body as staying,
      with the reason from the RFC's § "Per-name decisions" and the Rails
      `file:line` the site ports.
- [ ] Each replaced site was checked against its Rails body. The check is
      about what the receiver can be and what the site does with the result,
      not about the name.
- [ ] No test title changes: `git diff origin/main...HEAD -- '*.test.ts' |
grep -E '^[-+].*\b(it|test|describe)\('` is empty.
- [ ] An import of `hasKey` with no remaining use in its file is removed.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:arms:throws` and
      `pnpm parity:api:extra:gate` green with no baseline row and no
      `@missingRailsCall` / `@missingRailsArgs` receipt added. A row that goes
      stale is deleted by hand and tightened.
- [ ] The touched test files pass (`pnpm vitest run <file>`); the full suite is
      CI's.
- [ ] The PR body gives the before and after line counts for `hasKey` in
      these packages.

## Definition of done

A regex or codemod sweep does not close this story: each site is edited by hand
after reading the Rails body it ports. A new baseline row, `@missingRailsCall`
or `@missingRailsArgs` receipt does not close it either. A site left on the
helper for a reason in the RFC's § "Per-name decisions" is a correct outcome,
and is listed in the PR body with that reason.
