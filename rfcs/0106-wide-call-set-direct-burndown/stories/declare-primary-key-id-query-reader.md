---
title: "Declare PrimaryKey#id? — the ID_ATTRIBUTE_METHODS member trails never defined"
status: claimed
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-08-21T20:50:32Z"
assignee: "converge-through-reflection-association-primary-key-body"
blocked-by: null
closed-reason: null
---

# `id?` is not exposed on `Base` — the `PrimaryKey`/`CompositePrimaryKey` query reader is missing

## Context

Surfaced by `delete-callerless-composite-primary-key-duplicate` (PR #6832).

Rails declares the reader twice:

- `activerecord/lib/active_record/attribute_methods/primary_key.rb:34-36`
  — `def id?; _query_attribute(@primary_key); end`
- `activerecord/lib/active_record/attribute_methods/composite_primary_key.rb:36-42`
  — `@primary_key.all? { |col| _query_attribute(col) }` for the composite arm.

`id?` is also a member of `ID_ATTRIBUTE_METHODS`
(`primary_key.rb:66`), which trails' `primary-key.ts` mirrors — the guard is
asked about `"id?"` even though nothing defines it.

trails has neither arm. The deleted `attribute-methods/composite-primary-key.ts`
carried an `isId` for it, but nothing imported that module, so the reader has
never been reachable. `packages/activerecord/src/primary-keys.test.ts:141`'s
`it("id?")` works around the gap in prose:

```ts
// TS: no id? predicate exposed on Base instances; test the equivalent check
expect(topic.id != null).toBe(true);
```

`_queryAttribute` itself exists (`attribute-methods/query.ts:57`), so this is a
missing declaration, not missing machinery.

## Converged shape

Declare the reader at the Rails name in `primary-key.ts`, with the composite arm
wherever the split from `restore-composite-primary-key-module-split` puts it.
The Ruby name is `id?`; the trails spelling comes from
`docs/ruby-ts-conventions.md`, and it is an accessor property, not a method
(CLAUDE.md, "Generated attribute readers are properties"), so it must not shadow
an inherited member.

Then rewrite `primary-keys.test.ts`'s `it("id?")` to Rails' body —
`assert_changes("topic.id?", from: true, to: false) { topic.id = nil }` — and
drop the workaround comment.

## Acceptance criteria

- [ ] `id?` is declared at its Rails name with both the scalar and composite
      arms, as a property.
- [ ] `primary-keys.test.ts`'s `id?` case asserts through the real reader.
- [ ] `parity:api` AR-closure rollup gains; `parity:api:extra --package
activerecord` does not gain names.
