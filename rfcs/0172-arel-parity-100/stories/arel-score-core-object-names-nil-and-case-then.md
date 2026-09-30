---
title: "arel: score Ruby `nil?` and `Case#then`, which arel ports but SKIP_GROUPS hides"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: skips
packages: ["arel"]
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

`SKIP_GROUPS[0]` in `scripts/parity/conventions.ts` (identity/reflection/dispatch names, not marked
PERMANENT) drops three arel definitions out of `parity:api` entirely (denominator "global skip 4"):

- `Arel::Nodes::BindParam#nil?` — `vendor/rails/v8.0.2/activerecord/lib/arel/nodes/bind_param.rb:23`; ported as `isNil` at
  `packages/arel/src/nodes/bind-param.ts:21`.
- `Arel::Nodes::Casted#nil?` / `Quoted#nil?` — `vendor/rails/v8.0.2/activerecord/lib/arel/nodes/casted.rb:15,41`; ported as `isNil` at
  `packages/arel/src/nodes/casted.ts:39,77`.
- `Arel::Nodes::Case#then` — `vendor/rails/v8.0.2/activerecord/lib/arel/nodes/case.rb:19`; ported with an overload at
  `packages/arel/src/nodes/case.ts:46-49`, because a `then` member makes every `Case` a thenable.

The ports exist; the skip only stops them being scored, verified, and pinned. `nil?` is a predicate,
so its spelling is `isNil` (the RFC 0156 predicate-kind rule). `then` on `Case` needs a scoped entry
(`SCOPED_SKIP_GROUPS` with `tsMirrorName: "then"`) rather than a global mapping, because
`Relation#then` / `FutureResult#then` are the ratified thenable of CLAUDE.md § "`Relation` is
evaluated by an async query".

This is the first of the SKIP_GROUPS convergence stories; `activerecord-score-core-object-protocol-names`
and `activemodel-score-core-object-freeze-and-initialize-clone` build on the mapping it adds.

## Acceptance criteria

- [ ] `nil?` is removed from `SKIP_GROUPS[0]` and maps to `isNil` in `rubyMethodToTs`, with a `scripts/parity/conventions.test.ts` case; `docs/ruby-ts-conventions.md` regenerated.
- [ ] `Case#then` is scored through a scoped entry naming `nodes/case.rb`.
- [ ] arel's denominator `global skip` drops 4 → **0**, matched rises by the four ported rows, and the three pairs are pinned in `scripts/api-compare/body-pins.json`.
- [ ] No activerecord/activemodel row turns red: every `nil?` definition they own is ported first or landed in the same PR.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
