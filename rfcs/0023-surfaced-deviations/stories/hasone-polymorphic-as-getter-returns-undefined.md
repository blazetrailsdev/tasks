---
title: "Polymorphic has_one :as instance getter returns undefined (loadHasOne works)"
status: claimed
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-06-20T17:01:28Z"
assignee: "hasone-polymorphic-as-getter-returns-undefined"
blocked-by: null
---

## Context

While porting the mutating-polymorphic join_model tests (PR #3586, RFC 0019
wave 2), the generated **instance getter** for a polymorphic `has_one :tagging,
as: :taggable` returned `undefined` even though the row exists.

`await (welcome as any).tagging` resolved to `undefined`, while
`loadHasOne(welcome, "tagging", { as: "taggable" })` and
`welcome.association("tagging").loadTarget()` both returned the correct
Tagging (id 1, `ctor` = `Post`). The wave-2 tests had to read via `loadHasOne`
/ `association("tagging").loadTarget()` to work around this.

Model: `packages/activerecord/src/test-helpers/models/post.ts` —
`this.hasOne("tagging", { as: "taggable" })`. Repro: load `posts(:welcome)`
(canonical fixtures) and read `.tagging`.

Rails: `post.tagging` returns the associated record. The trails has_one
accessor should route to the same loader the direct `loadHasOne` uses.

## Acceptance criteria

- [ ] `(post).tagging` instance accessor for a polymorphic `as:` has_one
      returns the associated record (matching `loadHasOne`).
- [ ] Regression test reading `.tagging` on a canonical `Post`.
- [ ] No api:compare / test:compare regression.
