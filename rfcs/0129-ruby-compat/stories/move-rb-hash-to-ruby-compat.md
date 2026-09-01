---
title: "Object#hash (rbHash) moves to ruby-compat, beside the rbEqual it is consistent with"
status: ready
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 140
priority: 53
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/rb-hash.ts` (**82 lines**, single export `rbHash`
at `:13`) is Ruby's `Object#hash` / `Array#hash` / `String#hash`, ported
because JS has no `hash` on any of them. RFC 0129's _Deferred — listed and
sized_ table names it ("`Object#hash` (`rbHash`) · 82 · already a single
canonical copy — a move, not a convergence"). It has no story yet; this is it.

Its own receipt already states the verdict:

```text
@noRailsEquivalent PERMANENT — `Object#hash` / `Array#hash` are C primitives
  (object.c, array.c), not Ruby methods, so they have no counterpart file.
```

Four-part test (README §1, §2, §4), item by item:

1. **No `vendor/rails/` counterpart.** Confirmed twice: no `.rb` under
   `vendor/rails/activesupport/lib/` defines it, and
   `parity:api:extra --package activesupport` lists `rb-hash.ts` as
   `1 novel, 0 moved [no Rails counterpart]` — i.e. no Rails file maps onto it
   at all. Nothing is measured today, so nothing is lost by moving it.
2. **MRI counterpart.** `vendor/ruby/object.c:4375`
   (`rb_define_method(rb_mKernel, "hash", rb_obj_hash, 0)`),
   `vendor/ruby/array.c:5205` (`rb_ary_hash`), `vendor/ruby/string.c:3629`
   (`rb_str_hash`). All three resolve at the pinned `v3_3_11`.
3. **trails actually calls it.** **58 call sites** outside the defining file:
   `arel` 54, `activerecord` 3, `activesupport` 1 (the barrel re-export). arel
   is the dominant consumer — a `hash` on every node — which is itself an
   argument for a leaf home rather than an activesupport one.
4. **No workspace dependency dragged.** `rb-hash.ts` has **zero `import`
   statements**. It is already a leaf; the move is mechanical.

Note the sequencing dependency the RFC records for its sibling: `rbEqual`
landed in `ruby-compat/src/rb-equal.ts` and `rb-hash.ts`'s doc comment states
the consistency invariant with it ("two objects that are `==` hash alike"), so
after this move the pair finally lives together.

## Acceptance criteria

- `rbHash` lives at `packages/ruby-compat/src/rb-hash.ts`, exported from the
  package index, with a resolving `vendor/ruby/object.c:4375` citation (plus
  `array.c` / `string.c` for the arms it implements) and a
  `@noRailsEquivalent PERMANENT` receipt.
- `activesupport/src/rb-hash.ts` becomes a bare re-export shim; the
  `@blazetrails/activesupport` public surface is unchanged and all 58 call
  sites keep working untouched. The shim is deleted by
  `delete-ruby-compat-reexport-shims`.
- Any private helper the file carries with no reachable call site is deleted
  rather than moved (README §1).
- `packages/ruby-compat` still has no `dependencies` block.
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  this diff, sized to the one export added — never a reseed.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows; `parity:test` delta non-negative.
- Tests move with the code and keep their names.
- `no-freeform-comments` is `error` on `packages/ruby-compat/**` — the
  relocated header prose survives only as one block comment carrying the
  `vendor/ruby/...:LINE` citation.
