---
title: "Prove or fix JoinDependency's residual un-joinable null returns, then drop the trails-only build guard"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5975
claim: "2026-08-03T14:27:46Z"
assignee: "converge-join-dependency-residual-unjoinable-null-returns"
blocked-by: null
closed-reason: null
---

## Context

PR #5968 removed the JoinDependency preload-fallback lane, so an association
`build` can't JOIN now raises instead of degrading to a preload. The raise
itself is a trails-only construct with no Rails analogue: `build`
(`packages/activerecord/src/associations/join-dependency.ts`, the `if (!node)`
arm) calls `findReflection` first — which raises Rails' `ConfigurationError`
for a name that doesn't resolve, mirroring `find_reflection`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:222`)
— and then throws a second `ConfigurationError` for the case where the
reflection DID resolve but `addAssociation` still returned null.

Rails never reaches that second state: `build`
(`join_dependency.rb:228`) JOINs every reflection it resolves. The null
returns that feed it are:

- `_addThroughViaJoinAssociation` returning null on `chain.length < 2` or
  `joins.length === 0`, then `addAssociation` falling through to
  `return null` for a through association
  (`join-dependency.ts`, the `assocDef.options.through` arm).
- The composite-key inline guards `Array.isArray(foreignKey) && !reflection`,
  `Array.isArray(primaryKey) && !reflection`, `Array.isArray(sourcePk) &&
!reflection` and the `isBelongsTo && !reflection` target-PK guard. These are
  reachable only on the reflection-less inline join path.
- `!assocDef` and `!targetModel` (modelRegistry miss).

The sweep taken for PR #5968 — every AR test file reaching eager loading, 80
files and 4534 tests — never reached any of them. That is evidence they are
dead, not proof, so the throw was kept as a loud guard rather than deleted.

## Acceptance criteria

- Determine, for each residual null return listed above, whether it is
  genuinely unreachable given that `findReflection` has already resolved the
  name. `_addOrReuse` is the only caller.
- For any arm that is reachable, fix the JOIN construction so the spec joins
  (the reflection-driven `JoinAssociation#joinConstraints` path already builds
  composite tuple ON clauses) rather than leaving it to the guard.
- For arms proven unreachable, delete the null return so `addAssociation`'s
  return type narrows to `JoinPart` and the trails-only second
  `ConfigurationError` throw in `build` can go with it, leaving only Rails'
  `find_reflection` raise.
- Join SQL unchanged for everything that already joins.
