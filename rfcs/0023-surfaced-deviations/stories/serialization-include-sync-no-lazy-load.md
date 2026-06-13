---
title: "Serialization include of an unloaded collection cannot lazy-load (sync vs Rails to_ary)"
status: done
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 12
pr: 3189
claim: "2026-06-13T12:46:13Z"
assignee: "serialization-include-sync-no-lazy-load"
blocked-by: null
---

## Context

Surfaced by PR #3138 (RFC 0022 b2, serialization-via-reader) and repeated
Copilot/Codex review.

Rails `ActiveModel::Serialization#serializable_hash` serializes an `include`d
collection via `records.to_ary.map { |a| a.serializable_hash }`
(`activemodel/lib/active_model/serialization.rb:140-142`), and
`ActiveRecord::Associations::CollectionProxy#to_ary` **lazily loads the rows
from the database** when the collection is not loaded
(`collection_proxy.rb:985-991` → `relation.rb:337-340`). So
`post.as_json(include: :comments)` issues a SQL query mid-serialization and
includes the rows.

trails serialization (`serializableHash` / `asJson`) is **synchronous** (Rails
parity — returns a hash, not a promise), while trails' collection loading is
`async` (`await post.comments.load()` / `await post.comments`). RFC 0022 b2
also requires serialization to issue no DB load. There is therefore no
synchronous path from an unloaded `CollectionProxy` to its rows.

PR #3138 resolved this by **failing loud**: serialization throws when an
included collection reports `loaded === false`, directing the caller to preload
(await the association, or eager-load via includes/preload) instead of silently
emitting `comments: []`. That is safe (no silently-wrong output) but is still a
behavior change from Rails, which loads-and-includes.

## Desired end state

`asJson` / `serializableHash` return a **thenable hash** — one object usable
both ways, mirroring the existing `CollectionProxy` thenable
(`collection-proxy.ts`, wired via `applyThenable`). The call site, not the
method, picks the mode:

- **Sync use** — `const h = record.asJson({ include: "comments" })` then reading
  `h.comments`, or `JSON.stringify(record)` (via `toJSON`) — builds the hash
  eagerly. An unloaded `include`d association **throws** (the b2 / PR #3138
  fail-loud behavior, unchanged). `JSON.stringify` / `toJSON` are inherently
  synchronous and therefore always fail-loud on an unloaded include.
- **Awaited use** — `await record.asJson({ include: "comments" })` — runs the
  async path: preload the unloaded `include`d associations (through the reader /
  `CollectionProxy.load` / singular `load*`), then resolve the complete hash
  with the rows. This matches Rails' `to_ary`-driven load-and-serialize for
  `post.as_json(include: :comments)`.

A function cannot detect whether its return value will be awaited, so this is
implemented by returning a thenable — NOT by branching on call style.

### Design notes / constraints

- The eager build must not throw _before_ `.then()` can run, or `await` can
  never reach the async path. So the returned object computes scalars +
  already-loaded includes eagerly and **defers** unloaded includes; the
  fail-loud throw fires only on synchronous property access / key enumeration
  (e.g. a Proxy `get` / `ownKeys` trap), while `.then()` loads them first.
- Async path resolves a **plain object** (not a thenable) so nested
  serialization and `JSON.stringify` of the awaited result behave normally.
- No `_cachedAssociations` / include-bag reintroduced — loading goes through the
  real readers (built on PR #3138's send-through-the-reader foundation).
- Cross-cutting: touches every `asJson` / `serializableHash` / `toJson` caller's
  type (now thenable). Audit call sites; keep `toJSON` strictly sync.
- **Singular asymmetry (also surfaced by #3138):** an unloaded `belongsTo` /
  `hasOne` include currently serializes **silently absent**, not fail-loud — the
  sync reader returns `null` for both "unloaded" and "genuinely nil", so there
  is no `loaded`-style flag to distinguish them (unlike `CollectionProxy`). The
  async path must load these on `await`; decide whether the sync path should
  also fail-loud for an unloaded-but-loadable singular (needs the holder's
  `loaded` state, not just the reader's return) or accept the silent skip.

## Acceptance criteria

- [ ] `asJson` / `serializableHash` return a thenable; sync access fails loud on
      an unloaded include, `await` lazy-loads then resolves the full hash.
- [ ] `await record.asJson({ include })` loads unloaded `has_many` / `has_one` /
      `belongs_to` includes (nested includes too) and serializes the rows,
      matching Rails' `to_ary` behavior.
- [ ] Singular (`belongsTo` / `hasOne`) unloaded-include behavior decided and
      implemented consistently with collections (see Singular asymmetry note).
- [ ] Synchronous `JSON.stringify(record)` / `toJSON` still throw on an unloaded
      include (documented: sync paths cannot lazy-load).
- [ ] No `_cachedAssociations` / include-bag reintroduced; loading routes
      through the readers.
- [ ] Existing sync `asJson` / `serializableHash` callers and their types
      audited for the thenable return; `serialization.rb` / `serializers/json.rb`
      api:compare delta stays non-negative.

## Relationship to PR #3138 (b2)

Additive, not a replacement. #3138 removed the include-bag and routed includes
through `send`/the reader, and made the **sync** path fail loud on an unloaded
include — which is exactly the sync-branch behavior of this end state. The
thenable async path layers on top of that foundation; it cannot be built
cleanly without it. #3138 merged as-is; this story delivers the async path
later.
