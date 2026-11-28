---
title: "activerecord: asJson and serializableHash return Serialized<this, O, Base>"
status: draft
updated: 2026-11-27
rfc: "0000-typed-json-openapi"
cluster: typed-serialization
packages: [activerecord]
deps: [typed-serialized-type-algebra]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 2. Wire the type algebra into `ActiveRecord::Base`'s
`asJson` / `serializableHash` with a `const O extends TypedSerializeOptions<this, Base>`
parameter. The `SerializableHash` thenable shape is kept
(`Serialized & PromiseLike<Serialized>`).

## Acceptance criteria

- [ ] `post.asJson({ only: ["id"] })` is typed `{ id: number }` with no `as const`.
- [ ] `await post.serializableHash({ include: "comments" })` types `comments` as an array.
- [ ] A misspelled `only:` key is a type error at the call site.
- [ ] `tsc` check time on trailmap is measured with 1-, 3- and 5-deep includes. If
      5-deep adds more than 10%, recursion is capped at 4 (RFC Open question 1).
- [ ] Full-tree `pnpm typecheck` is green. Existing call sites that pass
      computed `string[]` options still compile (they fall back to the untyped return).
