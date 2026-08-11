---
title: "Stop the call-arg comparator counting Ruby attr_reader reads as calls"
status: draft
updated: 2026-08-11
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
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

Surfaced while converging the RFC 0099 explicit-host argument rows in PR #6359
(`call-args-ar-host-param-associations`).

The call-argument comparator counts a bare Ruby `attr_reader` read as a 0-arg
CALL node, because in Ruby it is one. The TypeScript counterpart of an
`attr_reader` is a getter or a plain field, and reading it is not a call node.
So a body that is a character-for-character correct port still reports an
`args` mismatch: Rails has N+1 call sites where trails has N, and the extractor
pairs the surviving TS call against the wrong Ruby one.

Three rows in the RFC 0095 baseline are exactly this, and PR #6359 had to leave
them baselined with prose reasons rather than converge them, because there is
nothing in the port to fix:

- `associations/association-scope.ts` `transform_value` → `value_transformation`
  — `association_scope.rb:52` is `attr_reader :value_transformation`; :78 is
  `value_transformation.call(value)`. trails: `this.valueTransformation(value)`
  (a getter read, then invoke).
- `associations/preloader/branch.ts` `grouped_records` → `association` —
  `branch.rb:7` is `attr_reader :association`; :84 is
  `record.class._reflect_on_association(association)`. trails:
  `this.association` is a field.
- `associations/preloader/branch.ts` `preloaders_for_reflection` → `association`
  — same reader, `branch.rb:93`.

Each is a false positive. They inflate the `kind: "args"` row count, which is
the debt metric the RFC 0095 ratchet is measured on, and they cost every
convergence story that meets one a round of analysis to conclude "nothing to
do".

## Converged shape

The extractor knows which Ruby names are `attr_reader` / `attr_accessor` /
`attr_writer` on the enclosing class (it already parses the class body). A
0-arg call to such a name is an ATTRIBUTE READ, not a method call, and should
be normalized away on the Ruby side before pairing — the same way the port
spells it. Once the Ruby side no longer emits a call node for a bare reader
read, the two sides pair correctly and the rows disappear.

Care is needed for the case where an `attr_reader` name is also called WITH
arguments in the same body (`branch.rb`'s `record.association(association)`
against the reader `association`): only the 0-arg, implicit-receiver form is a
reader read.

## Acceptance criteria

1. A bare 0-arg call to a name declared `attr_reader`/`attr_accessor`/
   `attr_writer` on the enclosing Ruby class is not emitted as a call node by
   the argument comparator; a call to the same name WITH arguments, or on an
   explicit non-`self` receiver, still is.
2. The three rows above go stale and are DELETED from
   `scripts/api-compare/call-mismatches-exclude/activerecord/associations/`
   (only-shrink; by hand, never `--write`).
3. Any other baseline rows the change makes stale across all packages are
   deleted in the same PR; the total `kind: "args"` row count only falls.
4. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; the
   comparator's own unit tests cover the reader-read and the
   reader-name-called-with-args cases.
