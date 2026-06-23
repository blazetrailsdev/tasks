---
title: "Self-healing reflection klass resolution to eliminate cross-file _klassCache poisoning"
status: ready
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #4006 (story `fixture-habtm-association-label-loader`). A reflection
memoizes its resolved target class in `_klassCache` by NAME via the global
`modelRegistry` the first time it's touched (`reflection.ts:614`, `:1529`), and the
through/source reflections derive from it. The hazard is already documented at
`reflection.ts:360-364`: a bespoke model registered under a canonical name by a
sibling test file (sharing a vitest worker) can be resolved first and cached
PERMANENTLY on the canonical reflection — restoring `modelRegistry` /
`Base._modelsByName` afterward does NOT un-poison it.

Concretely: `nested-through-associations.test.ts` registers a bespoke `Tagging`
(no `tag` source) under the canonical name; when vitest's size-based worker
distribution co-schedules it with `associations.test.ts`, canonical `Post.tags`
caches the wrong source class and PreloaderTest fails with
`HasManyThroughSourceAssociationNotFoundError`. This is non-deterministic across
PRs (any change to test-file byte sizes can reshuffle the worker layout and trigger
it), so it is a latent CI-flake generator.

PR #4006 shipped a **band-aid in the victim** (`associations.test.ts` PreloaderTest
`beforeEach` nulls `_klassCache`/`_throughReflectionCache`/`_sourceReflectionCache`/
`_sourceReflectionNameCache` on all 28 re-registered models). That hardens one
suite but does not fix the class of bug — any other suite sharing a worker with a
canonical-name-shadowing file is still vulnerable.

Counter-cache resolution already sidesteps this by using a LIVE registry lookup
instead of `self.klass` (`reflection.ts:360-372`, "registry lookup stays live so a
re-defined target is re-resolved"). The same philosophy should apply to the `klass`
getter itself.

Reference files:

- `packages/activerecord/src/reflection.ts:569,614-620` (AssociationReflection klass + `_klassCache`)
- `packages/activerecord/src/reflection.ts:1441-1446,1529` (ThroughReflection caches)
- `packages/activerecord/src/reflection.ts:360-372` (existing live-lookup precedent)
- `packages/activerecord/src/associations.test.ts` PreloaderTest `beforeEach` (the band-aid to remove)
- `packages/activerecord/src/associations/nested-through-associations.test.ts` (registers bespoke `Author`/`Post`/`Tag`/`Tagging` under canonical names — the polluter; an alternative/companion fix is to give these unique names)

## Acceptance criteria

- [ ] The `klass` getter (and the through/source reflection getters that derive
      from it) self-heal: when the live `modelRegistry` maps the reflection's
      `className` to a DIFFERENT class than the cached one, re-resolve rather than
      returning the stale cache. Mirror the counter-cache live-lookup precedent;
      preserve caching for the common (unchanged-registry) case and keep
      `anonymousClass`, namespaced (`::`), and STI resolution correct.
- [ ] The two-file repro fails before, passes after:
      `pnpm vitest run --no-file-parallelism
  packages/activerecord/src/associations/nested-through-associations.test.ts
  packages/activerecord/src/associations.test.ts`
- [ ] Remove the PreloaderTest `beforeEach` cache-reset band-aid added in PR #4006
      (the framework fix makes it unnecessary) and confirm the repro still passes.
- [ ] No regression in the broad associations/reflection suites; verify the hot-path
      `klass` getter change has no measurable perf cliff (it runs per association resolve).
