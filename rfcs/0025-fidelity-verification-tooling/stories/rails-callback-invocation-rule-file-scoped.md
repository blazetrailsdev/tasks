---
title: "File-scope rails-callback-invocations so cross-class name collisions stop forcing permanent grandfathers"
status: draft
updated: 2026-07-14
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `rails-callback-invocations` ESLint rule (`eslint/rails-callback-invocations.mjs`,
PR #4853) keys its callback-firing requirement purely by **method name**
(`manifest[name]`), so a requirement sourced from ONE Rails class leaks onto every
same-named method in `packages/activerecord/src/**`.

Concrete false positive surfaced by PR #4860: `initializeDup` requires the
`initialize` event solely because `Core#initialize_dup` fires
`_run_initialize_callbacks` (core.rb:553). But `Timestamp#initialize_dup`,
`Optimistic#initialize_dup`, `Aggregations#initialize_dup`, and
`SchemaCache#initialize_dup` all just `super` (fire nothing) — yet the rule flags
all of them. PR #4860 dodged this by deleting/renaming the model-side wrappers, but
`connection-adapters/schema-cache.ts#initializeDup` must stay **permanently
grandfathered** in `rails-callback-invocations-exclude.json` because SchemaCache is
not an AR model and its `initialize_dup` supers into `Object` (schema_cache.rb:264).

The manifest builder (`scripts/build-rails-privates-manifest.ts`,
`emitCallbackInvocationsManifest`) already walks the Rails source file-by-file and
has `rubyFileToTs` (used in the deprecated-methods pass at line ~210/348), so it can
attribute each callback requirement to the specific TS file that should fire it.

## Acceptance criteria

- Callback-invocation manifest entries are file-qualified (e.g.
  `packages/activerecord/src/core.ts#initializeDup`) so a requirement only applies to
  the ported method whose Rails source actually fires `_run_<event>_callbacks`.
- Rule looks up `${rel}#${name}` (with a documented fallback for bare-name entries if
  kept for back-compat) instead of bare `name`.
- `connection-adapters/schema-cache.ts#initializeDup` is removed from
  `rails-callback-invocations-exclude.json` and no longer flagged (its Rails source
  fires no callbacks, so no file-qualified requirement lands on it).
- Any exclude entries that become stale under file-qualification are pruned; the
  rule's own unit test (`eslint/rails-callback-invocations.test.mjs`) covers the
  file-scoped lookup.
- Regenerate the manifest via the `api:compare` / `rails-privates:manifest` path.

## Notes

File-qualification strictly narrows requirements (fewer functions flagged), so it
cannot introduce new failures — but it will make several currently-excluded entries
(e.g. delegating `destroy`/`_createRecord` overrides) stale-removable; scope the
cleanup deliberately rather than pruning the whole ratchet in one pass.
