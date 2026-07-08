---
title: "spawn should honor already_in_scope? (return model.all inside scoping block) instead of always cloning"
status: ready
updated: 2026-07-08
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/relation/spawn_methods.rb:9-11` —
Rails' `spawn` is `already_in_scope?(model.scope_registry) ? model.all : clone`.
It returns `model.all` (a fresh scoped relation) when the receiver is the current
scope inside a `scoping {}` / default-scope block, and only otherwise `clone`s.

trails' `performSpawn` (`packages/activerecord/src/relation/spawn-methods.ts`) is
unconditionally `this._clone()` — there is no scope-registry / `already_in_scope?`
check. This surfaced while converging merge onto the single `Merger#merge` path
(PR #4767): `merge` = `spawn.merge!`, so `merge` inside a `scoping` block clones
the current scope rather than re-deriving `model.all`, a latent divergence.
Behavior is unaffected for ordinary merges (the two coincide outside a scoping
block); this story tracks the fidelity gap for scoping-block cases.

## Acceptance criteria

- `spawn` mirrors `spawn_methods.rb:9-11`: returns `model.all` when
  `already_in_scope?(model.scope_registry)`, else `clone`.
- Requires a `scope_registry` `already_in_scope?` equivalent (or reuse of the
  existing current-scope tracking) — scope out if that registry does not yet exist
  and file its own prerequisite story.
- Add a test exercising `merge` / spawn inside a `scoping {}` block that would
  differ between `model.all` and `clone`.
