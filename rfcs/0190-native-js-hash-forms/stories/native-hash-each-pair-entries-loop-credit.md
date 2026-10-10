---
title: "Comparator credits each_pair from an Object.entries loop; keep_if joins the loop lowering"
status: draft
updated: 2026-10-10
rfc: "0190-native-js-hash-forms"
cluster: gate
packages: []
deps: [native-hash-form-marks-in-ts-extractor]
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

`Hash#each_pair` → `eachPair` is an unconditional row
(`scripts/parity/ruby-compat.ts:50`), and `each_pair` already lowers to a
`loop` in the arms skeleton (`SKELETON_IDIOM_LOWERINGS`,
`scripts/api-compare/enumerable-idioms.ts:369`). `each` is in
`NO_JS_CALL_FORM` (`compare.ts:415`) because a `for…of` has no callee;
`each_pair` is not, so a port that writes
`for (const [k, v] of Object.entries(h))` is flagged on the call set and told
to call `eachPair`. There are 39 non-test `eachPair` lines.

`delete_if` lowers to `[[], ["loop", "if"]]` (`enumerable-idioms.ts:402-407`).
`keep_if`, its inverse (`vendor/ruby/v3.3.11/hash.c:2844`), has no entry. The
RFC keeps `deleteIf` / `keepIf` / `hashReplace` as helpers (§ "Per-name
decisions"), so this story only makes the two lowerings consistent.

## Acceptance criteria

- [ ] `NATIVE_FORM_ANALOGUES` gains `each_pair` → form `entries`,
      `receivers: "explicit"`, `uncreditedKinds` of `self` and `const`. An
      `ivar` receiver IS admitted here (unlike `key?`): `each_pair` is not a
      `Relation` method, and `@options.each_pair` is common.
- [ ] Decide `Hash#each` on a hash receiver: it is already suppressed by
      `NO_JS_CALL_FORM`, so no row is added; say so in a comment at the new
      row.
- [ ] `keep_if` joins `SKELETON_IDIOM_LOWERINGS` with `delete_if`'s lowering.
- [ ] Comparer tests: `options.each_pair { }` with an `Object.entries(options)`
      loop credits; with an `Object.keys(options)` loop flags; with a loop over
      `Object.entries(other)` flags.
- [ ] All call gates and `pnpm parity:api:arms:throws` green, no baseline row
      added, stale rows deleted by hand.

## Verification

```bash
pnpm vitest run scripts/api-compare
pnpm parity:api:calls && pnpm parity:api:arms:throws
```
