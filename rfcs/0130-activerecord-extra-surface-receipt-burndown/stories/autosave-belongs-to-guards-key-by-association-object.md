---
title: "autosave belongs_to guards key by association object, not name"
status: done
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#7742
claim: "2026-09-13T22:57:43Z"
assignee: "autosave-belongs-to-guards-key-by-association-object"
blocked-by: null
closed-reason: null
---

## Context

Rails keys `@autosaving_belongs_to_for` / `@validating_belongs_to_for` by the association object itself (`activerecord/lib/active_record/autosave_association.rb`, `autosaving_belongs_to_for?(association)` / `init_internals`: `@autosaving_belongs_to_for = {}`). trails' `_guardKey` (`packages/activerecord/src/autosave-association.ts:12-19`) stringifies instead. It reads `.name` (a reflection), then `.reflection.name` (an association, added in trails#7733 when `Association#name` was deleted), then `String(association)`. Two distinct associations with the same name collide, and callers pass a mix of reflections and associations (`autosave-association.ts:278,317,441`).

## Acceptance criteria

- The guard stores are keyed by object (a `Map`/`WeakMap` keyed by what Rails keys by), and every call site passes the same kind of object Rails passes.
- `_guardKey` is deleted.
- The autosave suite stays green, including `callbacks on child when child autosaves parent twice`.
