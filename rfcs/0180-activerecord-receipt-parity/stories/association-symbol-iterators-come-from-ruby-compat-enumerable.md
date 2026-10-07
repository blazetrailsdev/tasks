---
title: "activerecord: JoinPart and CollectionProxy take [Symbol.iterator] from ruby-compat's Enumerable"
status: in-progress
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps:
  - errors-symbol-iterator-comes-from-ruby-compat-enumerable
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8663
claim: "2026-10-07T21:34:18Z"
assignee: "ar-read-attribute-for-validation-is-not-send"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

Two hand-written `[Symbol.iterator]` members in `packages/activerecord/src/associations/` carry
`@noRailsEquivalent`:

- `join-dependency/join-part.ts` `JoinPart`. Rails' is `include Enumerable` over `each`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency/join_part.rb:13,31-34`).
  trails ports `each` and does NOT `include(JoinPart, Enumerable)`; the generator re-implements the walk.
- `collection-proxy.ts` `CollectionProxy`. Rails' is `CollectionProxy < Relation`
  (`associations/collection_proxy.rb:31`), `Relation` is `include Enumerable` (`relation.rb:67`) and
  `each` reaches the records through `records` — `load_target` on a proxy
  (`collection_proxy.rb:1024-1026`).

No CLAUDE.md section names `[Symbol.iterator]`. It is the JS spelling of what Ruby's `for x in enum` /
`*enum` / `to_a` get from `each`, so it belongs on ruby-compat's `Enumerable`, derived once from the
includer's `each` — the shape `errors-symbol-iterator-comes-from-ruby-compat-enumerable` (RFC 0173)
builds for `ActiveModel::Errors`, and which names these two files as carrying the same member. This
story depends on that one.

`JoinDependency`'s own `[Symbol.iterator]` had no basis at all (`join_dependency.rb:158-160` defines
`each` and includes nothing) and was deleted by the audit PR.

## Acceptance criteria

- [ ] `include(JoinPart, Enumerable)` mirrors `join_part.rb:13`; `JoinPart`'s own generator and its receipt are deleted, and iteration comes from the mixin's `each`-derived iterator.
- [ ] `CollectionProxy`'s own `[Symbol.iterator]` and its receipt are deleted; `for…of` / spread over a loaded proxy still iterate its records through the Enumerable it inherits from `Relation`.
- [ ] `pnpm parity:api:extra:gate` and `:receipts:gate` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm vitest run packages/activerecord/src/associations/collection-proxy.trails.test.ts packages/activerecord/src/associations/join-dependency-walk.trails.test.ts
```
