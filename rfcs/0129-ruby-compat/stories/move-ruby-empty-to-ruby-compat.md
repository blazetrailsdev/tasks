---
title: "Ruby empty? (isEmpty), called from six packages, moves to ruby-compat"
status: in-progress
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 120
priority: 52
pr: 7360
claim: "2026-09-01T20:28:56Z"
assignee: "move-ruby-empty-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/ruby-empty.ts` (**31 lines**, single export
`isEmpty` at `:27`) is Ruby's `empty?`. RFC 0129 quotes this file's own doc
comment in Motivation §3 as "this RFC's thesis, already ratified for `empty?`",
and its _Deferred_ table lists it ("`empty?` (`isEmpty`) · 31 · the precedent
this RFC generalizes; moves once the call mapping exists"). It has no story
yet; this is it.

The file's receipt is already `PERMANENT` and already says where it belongs:

```text
@noRailsEquivalent PERMANENT `empty?` is Ruby core, not Rails — see the note
above, and `activerecord/src/ruby-truthy.ts` for the sibling.
```

Four-part test (README §1, §2, §4), item by item:

1. **No `vendor/rails/` counterpart.** Confirmed:
   `parity:api:extra --package activesupport` scores `ruby-empty.ts` as
   `1 novel, 0 moved [no Rails counterpart]`. `Array#empty?` / `Hash#empty?` /
   `String#empty?` are C, not `.rb`. (The file's receiver-dispatch arms follow
   `core_ext/object/blank.rb:96,111`, but that is Rails _calling_ `empty?`, not
   defining it.)
2. **MRI counterpart.** `vendor/ruby/array.c:2686` (`rb_ary_empty_p`),
   `vendor/ruby/hash.c:3023` (`rb_hash_empty_p`), `vendor/ruby/string.c:2243`
   (`rb_str_empty`). All resolve at the pinned `v3_3_11`.
3. **trails actually calls it.** **106 call sites** outside the defining file:
   `activerecord` 66, `activesupport` 33, `actionpack` 3, `arel` 2,
   `actionview` 1, `rack` 1. The widest consumer spread of any candidate in this
   audit, and six packages is precisely the "no single package's burndown will
   ever reach it" argument the RFC makes in Motivation §4.
4. **No workspace dependency dragged.** `ruby-empty.ts` has **zero `import`
   statements**.

The RFC's _Deferred_ note says it "moves once the call mapping exists". That
condition is about `ruby-core-call-mapping-table` being able to CREDIT the call
(`Array#empty?` → `isEmpty`), not about the file being able to move: the move is
independent and leaves the mapping story strictly easier, because after it the
callee has one importable home. If the scheduler wants the sequencing anyway,
add `deps: ["ruby-core-call-mapping-table"]`; the evidence does not require it.

## Acceptance criteria

- `isEmpty` lives at `packages/ruby-compat/src/ruby-empty.ts`, exported from the
  package index, with resolving `vendor/ruby/array.c:2686` /
  `hash.c:3023` / `string.c:2243` citations and a `@noRailsEquivalent PERMANENT`
  receipt.
- `activesupport/src/ruby-empty.ts` becomes a bare re-export shim; the
  `@blazetrails/activesupport` public surface is unchanged and all 106 call
  sites keep working untouched. The shim is deleted by
  `delete-ruby-compat-reexport-shims`.
- The `@internal` tag rides along correctly: RFC 0121 requires an `@internal` on
  a declaration absent from the rails-private manifest to ALSO carry a
  `@noRailsEquivalent PERMANENT` receipt — it already does, and it must still
  after the move, since ruby-compat members are absent from that manifest
  package-wide (README, Gate 2).
- `packages/ruby-compat` still has no `dependencies` block.
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  this diff, sized to the one export added — never a reseed.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows.
- Tests move with the code and keep their names.
