---
title: "attachment-variant-single-return-shape"
status: in-progress
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9711
claim: "2026-11-04T15:06:31Z"
assignee: "attachment-variant-single-return-shape"
blocked-by: null
closed-reason: null
---

## Context

`ActiveStorage::Attachment#variant` (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/attachment.rb:82-85`) is two
sync statements: `transformations = transformations_by_name(transformations)`, then `blob.variant(transformations)`. Rails
loads `blob` and `record` lazily inside the call.

In trails (`packages/activestorage/src/attachment.ts`, `variant`) an unloaded `blob` or `record` reads as a promise. So
`variant` answers synchronously only for a non-name argument with a loaded blob, and otherwise returns a promise. That
`if` carries `@inventedArm if — CONVERGEABLE attachment-variant-single-return-shape`. No CLAUDE.md section ratifies a
method returning a value-or-Promise union (the `attachment.rb` bullet covers only delegated reads).

## Acceptance criteria

- `Attachment#variant` has one return shape. Either an owner ruling ratifies the union in CLAUDE.md (the receipt becomes
  `PERMANENT` citing it), or the body converges to Rails' two statements with no invented `if`.
- `transformations_by_name`'s Symbol arm reads `named_variants` synchronously when `record` is loaded, or the ruling
  covers it.
