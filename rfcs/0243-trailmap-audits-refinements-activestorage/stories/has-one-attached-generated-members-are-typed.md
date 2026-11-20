---
title: "activestorage: has_one_attached / has_many_attached generated reader, writer and with_attached scope are typed on the model"
status: in-progress
updated: 2026-11-20
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10401
claim: "2026-11-20T03:51:34Z"
assignee: "audit-report-skill-posts-to-trailmap"
blocked-by: null
closed-reason: null
---

## Context

`has_one_attached :name` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/attached/model.rb:107-160`) generates a reader, the writer `name=` and the scope `with_attached_name`. trails' `hasOneAttached` (`packages/activestorage/lib/attached/model.ts:42`) defines all three at run time, but nothing types them for the host model. An application has to hand-declare each one:

- trailmap `app/models/audit.ts`: `declare body: One; declare setBody: (attachable: unknown) => Promise<void>;`
- trailmap `app/models/refinement.ts`: `declare setSummary`, `declare static withAttachedSummary`

It also has to cast the class to `Extended<typeof ClassMethods>` before it can call `hasOneAttached` at all. Every trails app repeats this boilerplate, and a typo in a `declare` type-checks and then fails at run time.

## Acceptance criteria

- [ ] A model that calls `hasOneAttached("body")` gets `body: One`, `setBody(attachable)` and `static withAttachedBody()` typed without a hand-written `declare`, for example through a generic helper type keyed on the literal name, or through `trails-tsc` schema-style codegen.
- [ ] The same holds for `hasManyAttached` (`Many`, `setX`, `withAttachedX`).
- [ ] trailmap's `declare` lines for `body`, `setBody`, `setSummary` and `withAttachedSummary` can be deleted once trails is re-vendored. That deletion is a separate trailmap PR.
