---
title: "Dirty: previous_changes must include in-place mutations after save"
status: ready
updated: 2026-06-09
rfc: "0015-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 25
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced post-merge during #2973 (serialize `:content` on canonical Topic +
dirty un-skips). `changesApplied` (`packages/activemodel/src/dirty.ts:108-120`)
snapshots `_previousChanges` from `_changedAttributes` only:

```ts
this._previousChanges = new Map(this._changedAttributes);
```

But an in-place mutation of a mutable attribute (e.g. a serialized hash mutated
via `record.content[:k] = v` without reassignment) is detected lazily via
`changedInPlace()` against `_originalAttributes` (see `dirty.ts:153-155`) and is
**not** present in `_changedAttributes` at save time unless it was force-changed.
So after save such a mutation is missing from `saved_changes` / `previous_changes`.

Rails' `changes_applied` archives the live `AttributeMutationTracker` as
`mutations_before_last_save`, so `previous_changes` naturally includes in-place
mutations (`active_model/dirty.rb`). This is **not** the JS-impossible in-place
_string_ mutation family already recorded in §Deferred — mutable hashes/arrays are
detectable in JS via the existing `changedInPlace()` path; the gap is that
`changesApplied` discards them.

## Acceptance criteria

- `changesApplied` snapshots the full set of changes — including currently-unforced
  in-place mutations on mutable attributes — into `_previousChanges` before clearing
  pending state (fold the `changedInPlace()` survey from `changedAttributeNames`
  into the snapshot).
- `savedChanges` / `previousChanges` after a save include an in-place serialized-hash
  mutation, matching `dirty_test.rb`'s serialized-attribute expectations.
- Add a test against the canonical `Topic#content` serialized attribute: mutate in
  place, save, assert the attribute appears in `savedChanges`/`previousChanges`.
- Related (note, do not necessarily fix here): `attributeChanged({from, to})` uses
  JS identity (`!==`) instead of type-cast equality; Rails calls `type.cast(from)`
  then `==`. Tracked alongside since both came out of #2973 — split if it grows.
