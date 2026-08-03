---
title: "Prove the JoinDependency preload-fallback lane is dead, then delete it (drops the 5th ctor arg, build's boolean return, capture/rollback)"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 5968
claim: "2026-08-03T13:40:15Z"
assignee: "drop-join-dependency-preload-fallback-lane"
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency`'s constructor takes a trails-only fifth argument,
`fallbackAssociations`
(`packages/activerecord/src/associations/join-dependency.ts`, constructor).
Passing an array selects a lenient build mode: a top-level spec whose segment
can't be JOINed is rolled back and pushed to that array so the caller degrades
it to preloading. Rails has no such concept — `build`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:228`)
raises and never returns a failure value.

The lane is not one deviation but five, all of which collapse together if it
goes:

- The fifth constructor argument, so the real arity is 5 against Rails'
  `initialize(base, table, associations, join_type)` (`join_dependency.rb:71`).
- `build` returning `boolean` instead of Rails' `JoinAssociation[]`.
- `_capture` / `_rollback`, which exist only to undo a partial build.
- `_raiseUnjoinable`'s `ArgumentError` arm, reached only when `findReflection`
  resolved the name but trails still couldn't build the JOIN.
- `Relation#_buildEagerJoinDependency` returning `{ jd, fallbackAssocs }`
  instead of a plain constructor call, plus the `fallbackAssocs.includes(...)`
  filtering at its callers in `packages/activerecord/src/relation.ts`.

The `return null` paths in `addAssociation` that feed the lane are guarded
`Array.isArray(key) && !reflection` — they fire only on the reflection-less
inline join path, which emits single-column equality. With a reflection
present, `JoinAssociation#joinConstraints` builds the composite tuple `ON`
clause and the join succeeds. That is why the composite-key stories
(`cpk-join-dependency-composite-fk-belongs-to`,
`cpk-join-dependency-composite-fk-collection`,
`composite-pk-eager-pluck-cache-preload-degrade`,
`close-composite-pk-through-eager-bypass-for-scoped-source`, all done) largely
emptied this lane without removing it.

### Measurement already taken

Instrumenting the `fallbackAssociations.push(spec)` site and running
`packages/activerecord/src/associations/` (1975 tests) plus
`packages/activerecord/src/relation/`, `eager.test.ts`, `join-model.test.ts`
and `cascaded-eager-loading.test.ts` produced exactly one fallback:
`Post {"comments":"nonExisting"}`, the deliberately-misspelled spec from
`join-dependency-spec.test.ts`. No real capability gap degraded.

This is suggestive, not proof. It does not cover trees outside
`associations/` and `relation/`, and the residual through arm
(`_addThroughViaJoinAssociation` returning null on `chain.length < 2` or
`joins.length === 0`) was never observed either way.

## Acceptance criteria

- Re-run the instrumented sweep across every AR suite, not just
  `associations/` and `relation/`, and record what (if anything) still
  degrades.
- If nothing legitimately degrades: delete the lane. The constructor drops to
  Rails' four arguments, `build` stops returning a failure value, and
  `_capture` / `_rollback` / the `ArgumentError` arm go with it.
- If a genuine gap remains, do not ratify it — fix the JOIN construction so the
  spec joins, or register the specific gap as its own story with the failing
  spec captured.
- `_buildEagerJoinDependency` collapses to a direct `new JoinDependency(...)`,
  and its callers drop the `fallbackAssocs.includes(...)` filtering.
- Note the behavior change: specs that silently preloaded now raise. Cover the
  calculation/exists paths, which reach this through
  `Relation#_checkEagerLoadable`.
- Join SQL unchanged for everything that already joins.
