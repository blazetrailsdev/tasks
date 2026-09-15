---
title: "converge-has-one-builder-define-writers-and-constructors"
status: closed
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Half delivered, half duplicated. defineConstructors half landed in trails#7753 (d9bef69c6a): origin/main packages/activerecord/src/associations/builder/has-one.ts no longer defines defineConstructors (only defineWriters at :18). The remaining defineWriters half is owned by converge-has-one-builder-define-writers, whose id is the one the live receipt at has-one.ts:17 names."
---

## Context

Split out of `converge-has-one-builder-and-through-writer-overrides`, which converged
`HasOneThroughAssociation#reset` / `#writer` (the persist step now lives in `replace`,
`has_one_through_association.rb:10`). Two builder overrides in
`packages/activerecord/src/associations/builder/has-one.ts` did not converge, for measured
reasons:

- `HasOne.defineWriters` — Rails inherits `Builder::Association.define_writers`
  (`builder/association.rb`, `def #{name}=`). Moving the `set${Name}` / `name=` twins into
  `Association.defineWriters` is easy, but the base also installs a property **setter**, and
  has_one is deliberately getter-only: a persisted-owner has_one write returns a promise a JS
  setter drops. Tried: `has-one-persisted-setter-throws.trails.test.ts` ("assigning the property
  is a plain JS write to a getter-only accessor", "mass-assignment (setAttributes) awaits the
  has_one writer") go red and unhandled `no such savepoint: active_record_1` rejections appear.
- `HasOne.defineConstructors` — Rails' `build_#{name}` is `SingularAssociation.define_constructors`
  (`builder/singular_association.rb:30-45`), no load. The TS override awaits
  `loadTargetForBuild` first because `create_through_record` (`has_one_through_association.rb:19`)
  loads the through target synchronously. Moving that load into `SingularAssociation#build` (by
  dropping `HasOneThroughAssociation#loadDisplacedForBuild`) reds 7 tests in
  `has-one-through-associations.test.ts` that call `association("club").build()` unawaited, as Rails does.

## Acceptance criteria

- [ ] `HasOne.defineWriters` is deleted; the awaitable `set${Name}` writer is defined in `Association.defineWriters` without making has_one's property assignment silently drop a promise.
- [ ] `HasOne.defineConstructors` is deleted; `buildX` on an unloaded has_one :through still issues exactly one through-table load (`has-one-through-build.trails.test.ts`) while `association(name).build()` stays synchronous.
- [ ] Both `CONVERGEABLE` receipts come out and `pnpm parity:api:extra:tighten` narrows activerecord's `total`.
