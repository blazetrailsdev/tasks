---
title: "create/create! add a parked-write drain Rails' new+save has no step for"
status: done
updated: 2026-08-08
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6212
claim: "2026-08-08T00:30:11Z"
assignee: "schema-conn-adapters-carry-a-real-pool"
blocked-by: null
closed-reason: null
---

## Context

Shipped by PR 6204 (`route-awaitable-callers-through-set-attributes`) and
justified at the call site, but a call Rails does not make.

Rails' `create` is `new(attributes, &block)` then `object.save`
(`vendor/rails/activerecord/lib/active_record/persistence.rb:38-42`; `create!` at
`:47-51`), and `initialize` yields to the block after `super`
(`vendor/rails/activerecord/lib/active_record/core.rb:206-217`), whose
`assign_attributes` has already assigned synchronously. There is no third step.

`packages/activerecord/src/persistence.ts`'s `create` / `createBang` add one:

```ts
const record = new this(mergedAttrs);
await awaitPendingNestedReaderLoads(record);
if (block) block(record);
```

A JS constructor cannot await, so `assignAttributes` parks the write a displacing
`#{name}_attributes=` key owes (`nested-attributes.ts`, `parkNestedReaderLoad`),
and the drain is what restores Rails' "assigned before the block" ordering. It
also forced `awaitPendingNestedReaderLoads` from module-private to exported
(`nested-attributes.ts`), widening that surface.

Two facts bound how much this currently costs. `save` already drains the same
queue (`nested-attributes.ts:181-182`), so the drain is not load-bearing for
persistence — only for what the block observes. And on a record under
construction the has_one writer never suspends on its own: it is new, so
`find_target?` is false and it holds no target to displace, which is why the
guard test has to make the writer suspend artificially
(`nested-attributes.trails.test.ts`, `settles the constructor's nested write
before create yields to the block`).

## Converged shape

`create` / `createBang` are `new(attributes, &block)` + `save` with no third
step, and the parked-write drain is not visible in them. That requires the
constructor itself to stop owing a write — i.e. retiring the parking, which is
the constructor language limit RFC 0087 already ratifies as its one genuine
exception, so this story may well end in `pnpm tasks block` pointing at that. It
is filed to make sure the extra call is re-examined rather than copied: if
another entry point ever grows a "construct then drain" pair, that is the signal
the parking needs solving, not another drain.

Coordinate with `retire-displacement-needs-await-branch` (same RFC, blocked),
which is about the same in-flight-write bookkeeping.

## Acceptance criteria

- [ ] `create` / `createBang` match `persistence.rb:38-42,47-51` with no
      drain call, OR the story is blocked with the specific constructor-parking
      blocker written down.
- [ ] If converged, `awaitPendingNestedReaderLoads` returns to module-private in
      `nested-attributes.ts`.
- [ ] The guard `settles the constructor's nested write before create yields to
the block` still expresses Rails' ordering (`core.rb:206-217`), or is
      retired with its reason. No test renames.
