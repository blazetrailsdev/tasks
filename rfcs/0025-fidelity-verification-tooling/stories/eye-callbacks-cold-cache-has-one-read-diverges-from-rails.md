---
title: "eye-callbacks-cold-cache-has-one-read-diverges-from-rails"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised in review of PR #5248 (`converge-autosave-association-bespoke-registermodel-canonical-shadows`).

`packages/activerecord/src/test-helpers/models/eye.ts` reads its `iris` has_one
through a private `irisTarget` getter that returns the loaded target or `null`:

```ts
private get irisTarget(): Iris | null {
  const assoc = this.association("iris");
  return assoc.isLoaded() ? (assoc.target as Iris | null) : null;
}
```

This exists because the trails has_one reader is async, so the `afterCreate` /
`afterUpdate` / `afterSave` callbacks — which Rails writes as a bare `iris` read
(`vendor/rails/activerecord/test/models/eye.rb`) — would otherwise receive a
thenable and blow up on `isPersisted()` / `hasChangesToSave`.

The divergence: Rails' reader calls `load_target` on a cold cache
(`vendor/rails/activerecord/lib/active_record/associations/association.rb` —
`find_target?` is not gated on `new_record?` alone; only _building_ is). So a
**persisted** Eye saved without anyone first touching `iris` still queries in
Rails and pushes onto `afterCreateCallbacksStack` /
`afterUpdateCallbacksStack` / `afterSaveCallbacksStack`, where the trails getter
pushes nothing.

No current test observes this — every caller pre-loads the target via
association assignment or nested attributes — but it is a latent source of a
mystery "missing stack entry" if the Rails tests that drive these stacks
(`autosave_association_test.rb:294-311`, the `iris_attributes` cases) are ported
later.

## Acceptance criteria

- Give `Eye`'s callbacks a Rails-faithful read of `iris` that resolves a cold
  cache, or document why trails cannot (sync callback boundary) and remove the
  `KNOWN DIVERGENCE` note in favour of that conclusion.
- If a sync-readable has_one target is the right primitive, scope it here rather
  than special-casing `Eye`.
- Porting `autosave_association_test.rb:294-311` (the `iris_attributes`
  callback-stack tests) is the natural coverage for whichever way it lands.
