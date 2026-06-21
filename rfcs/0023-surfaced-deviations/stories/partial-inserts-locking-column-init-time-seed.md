---
title: "Seed optimistic-locking column at record init (in-memory fidelity)"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["partial-inserts-locking-column-schema-default-init"]
deps-rfc: []
est-loc: 40
priority: null
pr: 3826
claim: "2026-06-21T19:26:43Z"
assignee: "partial-inserts-locking-column-init-time-seed"
blocked-by: null
---

## Context

Follow-up from PR #3815 review (story
`partial-inserts-locking-column-schema-default-init`).

PR #3815 seeds the optimistic-locking column from its schema default at **insert
time** (`base.ts` `_performInsert`, before `valuesForDatabase()`), which makes
the persisted INSERT row carry a concrete `0` and matches Rails' written value
exactly. But it does **not** seed at **record initialization**: in the
lazy-schema case (a model `new`'d before its first schema load, so the locking
column is not yet in `_attributeDefinitions` / the cached `_defaultAttributes`),
a trails record reads `nil` for the lock column **between `new` and `save`**.

Rails reflects the locking column's default (`0`) into every new record's
attributes at **class load** (`LockingType`/reflected default), so
`Model.new.lock_version == 0` in memory before any save (optimistic.rb; defaults
reflected at class load). This is a Rails in-memory fidelity divergence — benign
in practice (the window only exists when the lock column is read before the
first DB interaction that triggers reflection), but a real deviation.

trails already seeds attrs from `defaultValue` at `attributes.ts:157-162` when
`defaultValue != null`; the gap is that for a lazily-reflected locking column the
cached `_defaultAttributes` was built **before** reflection, so the already-built
instance never picks it up. A fuller-fidelity fix seeds the locking column at
reflection time (and/or invalidates the cached default attributes on reflection
so a subsequent `new` includes it).

## Acceptance criteria

- [ ] `Model.new.<lockingColumn>` reads its schema default (`0`) in memory
      **before any save**, even when the column is undeclared via `attribute()`
      and the model is `new`'d before its first schema load (the lazy-schema
      case `LockPersonalLegacyThing` exercises).
- [ ] The insert-time seed added in #3815 becomes redundant for this path (may
      be kept as a belt-and-suspenders guard or removed if the init-time seed
      fully subsumes it).
- [ ] `locking.test.ts` stays green under both `partial_inserts` settings; no
      regression to the cached-`_defaultAttributes` invalidation behaviour.
