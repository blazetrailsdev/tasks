---
title: "The ~40 inline-options findHasManyTarget call sites still name undeclared associations"
status: done
updated: 2026-08-28
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 7167
claim: "2026-08-28T15:22:55Z"
assignee: "burn-down-inline-fallback-call-sites-in-has-many-associations-test"
blocked-by: null
closed-reason: null
---

## Context

Follow-up on PR #7070, which closed
`find-collection-target-inline-fallback-skips-find-target-gate` by the story's
SECOND acceptance arm: the reflection-less holder now resolves `klass` from
`options.className` via `resolveAssocClass`
(`packages/activerecord/src/test-helpers/find-collection-target.ts:54-60`), so
`find_target?`'s trailing `&& klass`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:320-321`)
is answerable on every path and the `declared` branch is gone.

The story's FIRST arm — the converged shape — is still outstanding: trails still
lets a test build a has_many holder from a bare options hash for a name the
owner never declared. Rails has no such thing; `Association#initialize` takes a
reflection (`association.rb:41-45`) and every predicate downstream reads it.
The ~40 inline call sites live in
`packages/activerecord/src/associations/has-many-associations.test.ts`, e.g.
`findHasManyTarget(author, "destroy_all_posts", { className: "...", foreignKey:
"..." })` — snake_case names (`repl_mem_posts`, `foc_bang_posts`,
`one_sub_posts`, …) that no model declares.

Related but distinct:
[[owner-fk-inline-fallback-rungs-have-no-rails-counterpart]] covers the owner-FK
rungs, not these call sites.

## Converged shape

Every `findCollectionTarget` / `findHasManyTarget` call site names an
association the owner actually declares — a canonical model association, or one
added to the canonical test models where Rails has it
(`vendor/rails/activerecord/test/models/author.rb`) — so the helper always has a
real reflection and the `klass` fallback in
`find-collection-target.ts` can be deleted along with the `resolveAssocClass`
import.

Do NOT converge by adding bespoke models or tables; the names must come from
Rails' own test models.

## Acceptance criteria

- [ ] No `findCollectionTarget` call site passes a `name` the owner has not
      declared.
- [ ] The `klass: resolveAssocClass(...)` fallback in
      `find-collection-target.ts` is removed.
- [ ] `has-many-associations.test.ts` stays green with test names unchanged.
