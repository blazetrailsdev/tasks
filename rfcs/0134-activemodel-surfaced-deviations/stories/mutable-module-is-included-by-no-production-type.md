---
title: "ActiveModel::Type::Helpers::Mutable is included by no production type; Json and Serialized hand-roll its members"
status: claimed
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-05T02:22:17Z"
assignee: "flip-rack-deflater-onto-the-zlib-seam"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::Helpers::Mutable` exists so that mutable types get `cast`,
`changed_in_place?` and `mutable?` from ONE module. Rails mixes it in at every
such type:

- `activerecord/lib/active_record/type/json.rb:6` — `include ActiveModel::Type::Helpers::Mutable`
- `activerecord/lib/active_record/type/serialized.rb:8` — same

trails ports the module (`packages/activemodel/src/type/helpers/mutable.ts`,
`MutableModule`) but **no production type includes it**. `grep -rn MutableModule
packages/*/src` outside its own file and `index.ts` returns nothing; its only
consumer is `mutable.test.ts`, which builds a `FakeJsonType` to exercise it.

Instead both real types extend `ValueType` and hand-roll the members the module
would have supplied:

- `packages/activerecord/src/type/json.ts:24` — `class Json extends ValueType<unknown>`,
  with its own `cast` (line 34, the module's `deserialize(serialize(value))` body
  re-typed with a null guard) and its own `isMutable` (line 56).
- `packages/activerecord/src/type/serialized.ts:108` — `class Serialized extends ValueType`,
  with its own `isMutable` (line 183).

So the module is dead surface carrying a `@noRailsEquivalent PERMANENT` receipt,
and the shared bodies are duplicated at each site — a Rails dev reading
`json.ts` would expect the `include` and does not find it. Rails' `Json` legitimately
OVERRIDES `changed_in_place?` (`json.rb:19-21`) and `Serialized` overrides `cast`,
but both still take the rest from the module.

Surfaced while converging `Mutable#changed_in_place?` to Rails' one-line body
(PR #7478, story `mutable-changed-in-place-reserializes-raw-old-value`): the
convergence was safe precisely BECAUSE nothing includes the module, which is
what makes it worth a story.

## Converged shape

`include(Json, MutableModule)` and `include(Serialized, MutableModule)` via
`include()` from `@blazetrails/activesupport` (the settled Ruby-`include` idiom),
deleting the hand-rolled `cast` / `isMutable` copies that the module supplies and
keeping only the members Rails genuinely overrides at each site. Once the module
has real includes, its `@noRailsEquivalent PERMANENT` receipt should be
re-examined — it is the port of a real Ruby module and may not need one.

Check the `Mutable` interface merge each class needs on the type side, and
confirm `ValueType`'s own `isMutable` (`packages/activemodel/src/type/value.ts:84`)
still loses to the mixed-in one at runtime.

## Acceptance criteria

- [ ] `Json` and `Serialized` obtain `cast` / `changed_in_place?` / `mutable?`
      from `MutableModule` rather than redeclaring them, mirroring
      `json.rb:6` and `serialized.rb:8`.
- [ ] The members Rails overrides at each site (`Json#changed_in_place?`,
      `json.rb:19-21`; `Serialized#cast`) stay overridden; nothing else does.
- [ ] `pnpm parity:api:calls` and `parity:api:extra:gate` non-negative.
- [ ] AR json + serialized + dirty suites green on all three adapter lanes.
