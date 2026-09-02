---
title: "ancestorChain resolves a cross-package superclass to nothing"
status: draft
updated: 2026-09-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7395 (RFC 0126) while wiring `packageOf` through
`resolveEntityByDeclaringFile`.

`ancestorChain` (`scripts/api-compare/compare.ts:4708-4715`) walks a TS class's
`superclass` chain to compare it against the Rails ancestor chain, resolving
each step through `resolveAncestor` (`:4705-4706`):

```ts
const resolveAncestor = (name: string, childFile: string, declFile?: string) =>
  resolveEntityByDeclaringFile(tsByShort.get(name) || [], childFile, declFile);
```

`tsByShort` is built at `:4696-4703` from `Object.values(tsPkg.classes)` — the
CURRENT package only. So when a superclass resolves to another workspace
package, its `superclassFile` carries `pkg:<package>:<path>` (PR #7395), no
candidate in `tsByShort` is from that package, and the walk resolves to nothing
and stops.

The two `resolveEntityByDeclaringFile` call sites disagree: the inheritance-walk
one (`resolveParent`, `:3465-3472`) is given both a candidate pool spanning dep
packages (`buildEntitiesByName`, which calls `addPkg` for every
`blazetrailsDepKeys(pkg)`) and a `packageOf` accessor; `resolveAncestor` is
given neither.

No measured regression today — `inheritance:` was identical either side of
PR #7395 (activerecord 208/212, activemodel 41/42, actiondispatch 60/70,
rack 41/43) — because before the fix a `pkg:` superclass fell through to
proximity and matched nothing useful anyway. But the chain still cannot cross a
package boundary, and the AR/AM spine is exactly where it needs to:
`ActiveRecord::Base < ActiveModel::Model` and AR `type/text.ts` extending AM
`type/string.ts` are the cross-package edges the `inheritance:` metric is meant
to score.

## Converged shape

Build `resolveAncestor`'s pool the way `resolveParent`'s is built — via
`buildEntitiesByName(pkg, ts, foreignEntities, entityPackages)` — and pass the
same `isForeign` / `packageOf` accessors, so one resolver has one candidate
pool and one tie-break policy rather than two.

Watch that `ancestorChain`'s `seen` guard still terminates once the chain can
cross packages: the key is `${cursor.file}::${name}`, and two packages can carry
the same `file` string (`model.ts` exists in both activerecord and activemodel),
so the key likely needs the package too.

## Acceptance criteria

- [ ] `resolveAncestor` resolves a `pkg:`-qualified superclass to the dep
      package's entity.
- [ ] `ancestorChain` terminates on a cross-package cycle — pin it with a test
      over two packages declaring the same `file` + short name.
- [ ] Report the per-package `inheritance: N/M` delta; a RISE is the expected
      shape, and each newly matched chain is spot-checked against `vendor/rails`.
