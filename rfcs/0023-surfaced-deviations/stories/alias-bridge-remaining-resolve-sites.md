---
title: "alias-bridge-remaining-resolve-sites"
status: ready
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4980 (story `static-hasattribute-resolves-aliases`) converged class-level
and instance-level `has_attribute?` onto Rails' alias-resolution step, adding a
trails-only camelCase-key bridge (`resolveAliasNameIn`,
`packages/activemodel/src/attribute-methods.ts`). Trails stores alias KEYS
camelCase (`commentsCount`) while derived/DB names are snake_case
(`comments_count`); Rails needs no bridge because its alias keys already match
its column naming.

Codex review on #4980 correctly flagged that applying the bridge to only some
alias paths makes the surface incoherent — an attribute can report present via
`hasAttribute` while `readAttribute` returns nil. #4980 fixed that for the
public paths Rails names in the same breath: `has_attribute?`
(attribute_methods.rb:316-319), `read_attribute` (read.rb:31-34) and
`write_attribute` (write.rb:31-34), at both class and instance level.

**Remaining:** ~11 `resolveAliasName(` call sites in
`packages/activemodel/src/model.ts` still do the exact-only lookup — dirty
tracking (`attributeWas`, `attributeChange`, `attributeChanged`),
`readAttributeBeforeTypeCast`, and others. Rails runs the same single alias
step there too, so `post.attributeWas("comments_count")` currently misses where
`post.readAttribute("comments_count")` now resolves. Same root cause, same fix
shape, but each site needs its own decision about which attribute set defines
"ownership" for the precedence guard (the camelized key must never displace a
name the relevant set already owns — a projected
`SELECT COUNT(*) AS comments_count`, say).

Deliberately left out of #4980 to keep that PR bounded and reviewable; it was
already at 148 LOC across 7 files with the review cycle open.

## Acceptance criteria

- [ ] Audit every remaining `resolveAliasName(` site in
      `packages/activemodel/src/model.ts` (and any in activerecord) against its
      Rails counterpart; bridge the ones Rails alias-resolves, using
      `resolveAliasNameIn` with the correct `present` set.
- [ ] Sites that should stay exact-only (e.g. `_read_attribute`, which Rails
      documents as skipping alias resolution) are left alone and the reason
      recorded in a comment.
- [ ] A trails-only test asserts dirty tracking agrees with
      `readAttribute`/`hasAttribute` for a camelCase-keyed alias.
- [ ] No regressions in activemodel + the activerecord alias/dirty suites.

## Rails source

- `activerecord/lib/active_record/attribute_methods.rb:316-319` — instance `has_attribute?`
- `activerecord/lib/active_record/attribute_methods/read.rb:31-34` — `read_attribute`
- `activerecord/lib/active_record/attribute_methods/write.rb:31-34` — `write_attribute`
- trails: `packages/activemodel/src/attribute-methods.ts` — `resolveAliasName` / `resolveAliasNameIn`
- trails: `packages/activemodel/src/model.ts` — remaining exact-only sites
