---
title: "Serialization include of an unloaded collection cannot lazy-load (sync vs Rails to_ary)"
status: draft
updated: 2026-06-12
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
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

The only way to match Rails' lazy-load is to make the serialization path
`async` (so it can `await proxy.toArray()`), which breaks Rails-sync parity and
ripples across every `asJson` / `serializableHash` / `toJson` caller — a
cross-cutting change well beyond b2's scope, tracked here.

## Acceptance criteria

- [ ] Decide whether trails should offer an async serialization path (e.g.
      `await record.asJsonAsync({ include })` / `loadForSerialization`) that
      lazily loads unloaded `include`d associations, matching Rails'
      `to_ary`-driven load, while keeping the sync `asJson` fail-loud.
- [ ] If pursued: unloaded `has_many` / `has_one` / `belongs_to` includes load
      on demand through the async path; the sync path keeps the b2 fail-loud
      behavior. No `_cachedAssociations` reintroduced.
- [ ] If declined: record the rationale and close, leaving the b2 fail-loud as
      the accepted deviation.
