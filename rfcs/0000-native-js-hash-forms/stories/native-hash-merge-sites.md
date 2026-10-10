---
title: "Hash#merge on a plain object is an object spread: every package with a site"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: substitution
packages: [actionpack, activerecord, trailties, rack-test, actionview, activesupport]
deps: [native-hash-each-pair-sites]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § "Per-name decisions": Ruby `merge` on a plain object ports as
`{ ...h, ...other }`, credited through the `@spread` mark once
`native-hash-forms-credit-key-delete-merge` has merged.

Two helpers are named `merge`: ruby-compat's (`packages/ruby-compat/src/hash.ts:259-275`,
`update(dup(hash), …)`, MRI `rb_hash_merge`) and activesupport's bare spread
(`packages/activesupport/src/hash-utils.ts:114-117`), which
`native-hash-merge-bang-sites-activerecord-activemodel-activesupport-trailties`
deletes. At trails `ddd629745a`, non-test files that import `merge` from
either package call it at:

| Package       | Call lines | Files  |
| ------------- | ---------- | ------ |
| actionpack    | 19         | 13     |
| activerecord  | 19         | 15     |
| trailties     | 7          | 7      |
| rack-test     | 2          | 1      |
| actionview    | 1          | 1      |
| activesupport | 1          | 1      |
| **Total**     | **49**     | **38** |

Re-count before starting: a bare `merge(` grep also matches local functions of
that name, so count only in files that import the helper.

ruby-compat's `merge` differs from a spread in three ways, and a site that
depends on one stays on the helper:

- it takes a trailing conflict block (`rb_hash_update_block_i`);
- it takes a `Map` / `Hash` on either side;
- it answers an ancestor-less object, in which `"__proto__"` is an ordinary
  key (`hashDupWithCompareById`, `hash.ts:939-941`), where a spread answers an
  `Object.prototype` object and drops a `"__proto__"` own key from a
  caller-supplied hash. A site merging caller-supplied keys stays.

`Relation#merge`, `Parameters#merge` and HWIA's `merge` are `.merge(` method
calls on ported classes and are not helper sites.

## Acceptance criteria

- [ ] Every helper `merge(` call in the packages above (source and test files)
      is either replaced by an object spread or listed in the PR body as
      staying, with the reason and the Rails `file:line` the site ports.
- [ ] Each replaced site was checked against its Rails body for the three
      differences above.
- [ ] No test title changes: the command under Verification prints nothing.
- [ ] An import of `merge` with no remaining use in its file is removed.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:arms:throws` and
      `pnpm parity:api:extra:gate` green with no baseline row and no
      `@missingRailsCall` / `@missingRailsArgs` receipt added.
- [ ] The touched test files pass.
- [ ] The PR body gives the before and after counts.

## Verification

```bash
git diff origin/main...HEAD -- '*.test.ts' | grep -E '^[-+].*\b(it|test|describe)\('
```

## Definition of done

A regex or codemod sweep does not close this story: each site is edited by hand
after reading the Rails body it ports. A site left on the helper for one of
the three reasons above is a correct outcome and is listed in the PR body.

## Notes

If the count is well above 49 when the story is picked up, ship the packages
that fit under the LOC ceiling and file the rest with `pnpm tasks new`.
