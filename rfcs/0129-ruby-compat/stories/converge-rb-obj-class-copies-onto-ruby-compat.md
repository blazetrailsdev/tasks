---
title: "converge-rb-obj-class-copies-onto-ruby-compat"
status: in-progress
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 68
pr: 7394
claim: "2026-09-02T17:24:58Z"
assignee: "ruby-compat-hash-fetch-block-arm"
blocked-by: null
closed-reason: null
---

## Context

`CLASS_OF` / `rb_obj_class` (`vendor/ruby/object.c:296`) — the class name Ruby's
conversion and `no_dig_method` errors name a value by — is copied five times,
each a private function in the file that needed it:

- `packages/ruby-compat/src/comparable.ts:158` (`rbObjClass`, the fullest: adds
  the `rubyClass` brand and the `Time` reading)
- `packages/ruby-compat/src/kernel-float.ts:69` (`rbObjClass`)
- `packages/activesupport/src/array-utils.ts:284` (`rubyClassName`)
- `packages/activesupport/src/transliterate.ts:12` (`rubyClassName`)
- `packages/activesupport/src/cache/store.ts:33` (`rubyClassName`, and it
  answers `"nil"`/`"true"`/`"false"` where the others answer `NilClass` /
  `TrueClass` / `FalseClass`)

A sixth was added by PR #7345 in
`packages/activesupport/src/hash-with-indifferent-access.ts` for
`HashWithIndifferentAccess#dig`'s `no_dig_method` TypeError
(`vendor/ruby/object.c:3897-3900`), because the copies are private and
ruby-compat's `novel` extra surface is pinned at 0 — exporting `rbObjClass`
would have grown a gated dimension in an unrelated PR.

All six exist for the same reason: one JS `Number` seats both Ruby `Integer`
and `Float`, so `constructor.name` is wrong for every numeric value.

## Acceptance criteria

- One implementation, exported from `@blazetrails/ruby-compat` under the Ruby
  name (`rb_obj_class` → `rbObjClass`), carrying a
  `@noRailsEquivalent PERMANENT` receipt naming `vendor/ruby/object.c:296`.
- The five (six with #7345) private copies are deleted and their call sites
  import it; `cache/store.ts`'s lowercase `"nil"`/`"true"`/`"false"` answers are
  reconciled against MRI first — check what the message it builds actually
  prints in Ruby before changing it, and keep a local shim only if MRI really
  does spell it that way there.
- `pnpm parity:structural-duplicates:report` no longer lists an
  `rbObjClass`/`rubyClassName` candidate.
- `pnpm parity:api:extra:gate` — ruby-compat's `total` mark is raised only as
  the reviewed step this story is, and `novel` stays 0 via the receipt.
