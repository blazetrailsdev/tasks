---
title: "Port remove_target! as a HasOneAssociation method instead of a free function"
status: ready
updated: 2026-07-27
rfc: "0068-awaitable-has-one-setter"
cluster: null
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

Rails' `remove_target!(method)` is a **private instance method of
`HasOneAssociation`** acting on `self.target`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:95-115`),
called from `replace` (:69).

trails ports it as a module-level `@internal` function instead
(`packages/activerecord/src/associations/has-one-association.ts:715`):

```ts
async function removeTargetBang(
  assoc: HasOneAssociation,
  method: string,
  target: Base | null = assoc.target,
): Promise<void>;
```

Two divergences from the Rails shape:

- It is a free function taking the association as its first argument, so it
  reaches into the class through `(assoc as any).nullifyOwnerAttributes(...)` /
  `(assoc as any).setOwnerAttributes(...)` casts, and `api:compare` cannot match
  it to Rails' method (it counts as missing surface on `HasOneAssociation`).
- It carries an extra `target` parameter Rails does not have. PR #5455 converged
  the two displaced-removal helpers into one `detachDisplacedTarget(displaced)`,
  which always passes that argument explicitly; only `persistImmediate`
  (has-one-association.ts:127) still takes the default. The parameter exists
  because trails' deferred removal paths run while `assoc.target` is already the
  replacement — Rails' removal is inline inside `replace`, where `self.target`
  is still the displaced record.

## Acceptance criteria

- [ ] `remove_target!` is ported as a method on `HasOneAssociation` named
      `removeTargetBang`, matched by `pnpm api:compare` against
      `has_one_association.rb:95` (activerecord missing count drops).
- [ ] The `any` casts to `nullifyOwnerAttributes` / `setOwnerAttributes` go away
      (they become `this.` calls).
- [ ] Either the extra `target` parameter is eliminated (e.g. by having the
      deferred call sites present the displaced record as `this.target` without
      it being observable) or it is justified at the declaration with the
      call-site reason — the args-parity gate must stay green either way.
- [ ] No behavior change: `has-one-associations.test.ts`,
      `has-one-sync-build-displacement.trails.test.ts`,
      `nested-attributes-displaced-removal-failure.trails.test.ts` and
      `has-one-through-associations.test.ts` pass unchanged.
