---
title: "Drop the foreign_key/class_name options trails already infers on 8 associations"
status: draft
updated: 2026-10-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

twin-diff (trailmap#84) reports `redundant-inferable-option` on 8 associations. The TS spells out a `foreignKey` / `className` that Rails infers, and the Rails twin omits it:

- `app/models/owner.ts:44` `hasMany("repositories", { foreignKey: "owner_id" })`
- `app/models/owner.ts:49` `hasMany("collaborations", { foreignKey: "owner_id" })`
- `app/models/repository.ts:54` `belongsTo("owner", { className: "Owner", foreignKey: "owner_id" })`
- `app/models/repository.ts:57` `hasOne("settings", { foreignKey: "repository_id" })`
- `app/models/repository.ts:62` `hasMany("collaborators", { foreignKey: "repository_id" })`
- `app/models/repository-collaborator.ts:56-57` `belongsTo("repository" / "owner", { className, foreignKey })`
- `app/models/repository-setting.ts:41` `belongsTo("repository", { className, foreignKey })`

Checked against the vendored trails: with the options removed, `reflectOnAssociation(n).foreignKey()` answers `owner_id` / `repository_id` and `className` answers the right class for every one. trails infers them as Rails does, so this is redundant app code, not a framework workaround. The `dependent:` options are explained in comments and stay.

## Acceptance criteria

- The 8 associations drop the inferable `foreignKey` / `className` and keep `dependent` / `inverseOf`.
- The association tests under `test/models/` still pass.
- twin-diff no longer reports `redundant-inferable-option`.
