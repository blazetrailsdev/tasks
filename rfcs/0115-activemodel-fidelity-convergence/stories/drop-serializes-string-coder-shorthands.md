---
title: "Drop serialize's string coder/type shorthands so callers pass Rails' kwargs"
status: draft
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `serialize` takes the coder and the object class straight off its kwargs
— `serialize(attr_name, coder: nil, type: Object, yaml: {}, **options)`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/serialization.rb:183`)
— and `build_column_serializer` (`:208-223`) branches on the constants `::JSON`,
`::YAML` and `Coders::YAMLColumn`.

trails adds two spellings Rails has no counterpart for, in
`packages/activerecord/src/attribute-methods/serialization.ts`:

- string coder shorthands `coder: "json" | "array" | "hash"`, which
  `resolveCoderAndType` expands to `coder: JSON` plus
  `type: Array | Hash` before the Rails body runs;
- `HashObject`, a `Symbol.hasInstance` stand-in for Ruby's `Hash` used as the
  `type:` object class, carrying a `@noRailsEquivalent PERMANENT` receipt.

`type: "Array" | "Hash"` string forms sit alongside the constructor forms for
the same reason.

Surfaced in `rehome-serialize-onto-attribute-methods-serialization` (PR #7176),
which moved the body onto the Rails file and so put these next to the Ruby they
are meant to mirror. `HashObject` is measured novel surface in
`parity:api:extra` from that move.

## Converged shape

Callers pass what Rails passes. `coder: "json"` becomes `coder: JSON` (the
global, which `buildColumnSerializer` already maps to `Coders::JSON` at
serialization.rb:211); `coder: "array"` / `"hash"` become
`coder: JSON, type: Array` / `coder: JSON, type: Hash`. `resolveCoderAndType`
then has nothing left to resolve and `serialize`'s body reads its kwargs
directly, branch for branch with :183-205.

`HashObject`'s fate is the open half: JS has no distinct hash class, so
`type: Hash` needs *some* stand-in. Decide whether it stays as a receipted
permanent (the `instanceof` / `new` contract `Coders::ColumnSerializer` needs)
or whether the two call sites that want it can pass `Object` and let
`ColumnSerializer` do the array check itself.

## Acceptance criteria

- [ ] No string coder shorthand remains: `resolveCoderAndType` is gone or is
      reduced to what a Ruby kwarg default does.
- [ ] `serialize`'s body reads `coder` / `type` / `yaml` off its options bag
      directly, mirroring serialization.rb:183-205.
- [ ] `HashObject` is either removed or its `@noRailsEquivalent PERMANENT`
      receipt states the settled reason at the call site.
- [ ] `pnpm parity:api:extra --package activerecord` delta non-negative;
      activerecord suite green on all three lanes.
