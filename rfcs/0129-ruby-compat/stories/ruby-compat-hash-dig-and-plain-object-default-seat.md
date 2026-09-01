---
title: "Adjudicate Hash#dig and decide the plain-object default seat (closes RFC 0023's open question)"
status: in-progress
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 34
pr: 7325
claim: "2026-09-01T02:28:10Z"
assignee: "ruby-compat-hash-dig-and-plain-object-default-seat"
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat-hash-default-proc-and-dig` shipped the `default` / `default_proc`
half — `class Hash extends Map` in `packages/ruby-compat/src/hash.ts` with
`default(...key)`, `setDefault`, `defaultProc()`, `setDefaultProc()` and a
`get` whose miss path runs the proc (`vendor/ruby/hash.c:2068`
`rb_hash_default_value`). It deliberately shipped NO `dig`, because the
inventory found no call site with Ruby `Hash#dig` semantics:

- `actionpack/.../request/session.ts:258`, `.../strong-parameters.ts:509`,
  `.../test-case.ts:795` are ports of Rails' own `dig` methods and stay put.
- `activerecord/src/store.ts:236` `dig(obj, key)` is a private single-key,
  HashWithIndifferentAccess-aware lookup — not variadic, no `TypeError` on a
  non-diggable intermediate. It is not `Hash#dig` and was left alone.

Two adoptions the default-seat story identified and did not take, both from
RFC 0023's `plain-object-has-no-hash-default-seat`:

- `hash_with_indifferent_access.rb:376-381` `to_hash` calls `set_defaults(copy)`
  on the plain Hash it returns; trails' `HashWithIndifferentAccess#toHash`
  returns a plain object with nowhere to put them.
- `core_ext/hash/slice.rb:13-14` `Hash#slice!` does `hash.default = default` /
  `hash.default_proc = default_proc if default_proc`;
  `packages/activesupport/src/core-ext/hash/slice.ts` documents the gap in its
  `sliceBang` JSDoc.

Both need those surfaces to return `ruby-compat`'s `Hash` rather than a plain
object, which reaches every caller of `toHash` — a separate, larger change.

## Acceptance criteria

- Adjudicate `activerecord/src/store.ts:236` `dig`: either it is `Hash#dig` and
  converges onto a ported `rb_hash_dig` (`vendor/ruby/hash.c:4627`, including
  the `rb_obj_dig` `"%s does not have #dig method"` TypeError,
  `vendor/ruby/object.c:3899`), or it is not and the finding is recorded.
- `Hash#dig` is exported from `packages/ruby-compat/src/hash.ts` ONLY if a real
  call site adopts it; the standing rule is "only what trails actually calls".
- Decide and implement the plain-object default seat for
  `HashWithIndifferentAccess#toHash` and `sliceBang`, or block the story with
  the specific blocker. RFC 0023's `plain-object-has-no-hash-default-seat` is
  closed by whichever outcome lands.

  **Decided (trails#7325): there is no plain-object seat to implement.** The
  seat is a type, not a field a plain object can be given, and trails already
  has it in both places Rails' `set_defaults` writes to an ActiveSupport
  receiver — `HashWithIndifferentAccess`'s own `_default` / `_defaultProc`,
  which is why its `dup` (`hash_with_indifferent_access.rb:264-268`) and
  `sliceBang` (`:366-369`) copy them faithfully today, and `ruby-compat`'s
  `Hash`. The only site left is `to_hash` (`:375-381`), and converging it means
  changing what it RETURNS — a migration of its 102 callers, each of which
  reads the result as an object literal. That is
  `hwia-to-hash-returns-ruby-compat-hash`, which carries the inventory; RFC
  0023's story is closed as superseded by it, and this criterion is satisfied
  by that decision, not by a `block`.
- `compare_by_identity` stays unported (`packages/rack/src/headers.ts:481` is a
  Rails-anchored override that raises).
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra` show no new rows; activesupport and all three AR lanes green.
