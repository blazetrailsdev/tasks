---
title: "hasown-replaces-hasownproperty-call"
status: in-progress
updated: 2026-10-19
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#9061
claim: "2026-10-19T13:42:19Z"
assignee: "hasown-replaces-hasownproperty-call"
blocked-by: null
closed-reason: null
---

## Context

The hand port spells an own-key test `Object.prototype.hasOwnProperty.call(o, k)` at 69 sites across packages, for example:

- activerecord (18 files): `result.ts:51` (`Result#includes_column?`), `sanitization.ts:201`, `relation.ts:803`, `inheritance.ts:47,133,139,173`, `attribute-methods/primary-key.ts:148,203`
- activesupport (17), actionpack (9), trailties (6), activemodel (5), actionview (4), ruby-compat (4), i18n (3), activerecord-cli (2), html-sanitizer (1)

CLAUDE.md § "Hash calls on a plain object" names `Object.hasOwn(h, k)` as the native form of Ruby `h.key?(k)` for a computed key. The codegen spike now emits `Object.hasOwn` for `key?` / `has_key?` / `include?` on a Hash (codegen-native-inference `4b1239b44f`), so the generated and hand code spell the same Ruby call two different ways.

The own-property memo guards (§ "`inherited` is deferred to own-property memo guards") quote `Object.prototype.hasOwnProperty.call(host, key)` in the CLAUDE.md text. Update that wording in the same change.

## Acceptance criteria

- No `Object.prototype.hasOwnProperty.call(` is left in `packages/*/src` (excluding vendored code). Every site is now `Object.hasOwn(o, k)`.
- Do the same for any `{}.hasOwnProperty.call` or bare `.hasOwnProperty(` spelling found.
- The CLAUDE.md `inherited` section names `Object.hasOwn`.
- Behaviour is unchanged, since `Object.hasOwn` has the same semantics. The typecheck and the touched test files pass.
