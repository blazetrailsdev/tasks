---
title: 'Drop serialize''s "YAML" string coder spelling so callers pass a constant'
status: draft
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`build_column_serializer` branches on Ruby's `::YAML` module constant —
`if coder == ::YAML || coder == Coders::YAMLColumn`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/serialization.rb:213`).

trails spells the first arm as the STRING `"YAML"`, in
`packages/activerecord/src/attribute-methods/serialization.ts`
(`buildColumnSerializer`: `if (coder === "YAML" || coder === YAMLColumn)`), and
call sites pass it that way:

- `packages/activerecord/src/test-helpers/models/admin/user.ts:29` —
  `this.store("params", { accessors: ["token"], coder: "YAML" })`
- `packages/activerecord/src/encryption/extended-deterministic-queries.trails.test.ts:96` —
  `buildSerializedBook({ previousSchemes: true, coder: "YAML" })`
- documented as the supported spelling in
  `packages/activerecord/src/coders/yaml-column.ts:92`

This is the last surviving member of the string-coder family that
`drop-serializes-string-coder-shorthands` (PR #7176/#7178) converged: that story
removed `coder: "json" | "array" | "hash"` and `type: "Array" | "Hash"` so
callers pass Rails' constants (`coder: JSON`, `type: Array`), but left the
`"YAML"` arm untouched because it was outside the story's stated scope. It is
debt, not a settled decision — a reviewer reading `coder: "YAML"` next to
`coder: JSON` sees two spellings for one Ruby idiom.

Note this is NOT the `":short"`-style colon-prefixed Symbol case from CLAUDE.md:
Ruby's `::YAML` is a module CONSTANT, the same kind of thing `::JSON` is, and
`::JSON` already ports as the JS global.

## Converged shape

Pick the trails object that stands for Ruby's `::YAML` module the way
`globalThis.JSON` stands for `::JSON`, and compare against it instead of the
string. If no such object exists yet, the `Coders::YAMLColumn` arm already
covers every call site — `coder: YAMLColumn` is a real constant, is the value
`defaultColumnSerializer` already defaults to, and hits the same branch — so the
string arm can simply be deleted and its three call sites moved onto it.

Either way `buildColumnSerializer` ends with two constant comparisons and no
string literal, mirroring serialization.rb:213.

## Acceptance criteria

- [ ] No string coder spelling remains in `buildColumnSerializer` or at any
      `serialize` / `store` call site.
- [ ] `buildColumnSerializer`'s YAML branch compares constants, matching
      serialization.rb:213.
- [ ] `pnpm parity:api:extra --package activerecord` delta non-negative;
      activerecord suite green on all three lanes.
