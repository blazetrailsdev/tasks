---
title: "delete-has-one-sync-property-setter"
status: done
updated: 2026-08-05
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: ["migrate-has-one-assignments-to-awaitable-writer"]
deps-rfc: []
est-loc: 250
priority: 6
pr: 6143
claim: "2026-08-05T20:53:11Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

With its call sites migrated (`migrate-has-one-assignments-to-awaitable-writer`),
the generated has_one `#{name}=` property setter can go. RFC 0087 §1.

Delete: the `Object.defineProperty(mixin, name, ...)` writer arm in
`HasOneBuilder#defineWriters`
(`packages/activerecord/src/associations/builder/has-one.ts:117-135`),
`HasOneAssociation#syncWrite` (`associations/has-one-association.ts:51-69`) and
`HasOnePersistedAssignmentError` (`associations/errors.ts`), which exists only
to describe the arm being removed.

Parity-neutral: Rails generates its writer dynamically too
(`vendor/rails/activerecord/lib/active_record/associations/builder/association.rb`,
`define_writers` into `generated_association_methods`), so neither extractor
scores the property. The scored surface is `set#{Name}`, which `rubyMethodToTs`
already accepts as a rendering of Rails' `#{name}=`
(`scripts/api-compare/conventions.ts:747-760`).

## Acceptance criteria

- [ ] The has_one `#{name}=` property setter is gone; assigning it is a plain
      JS no-op-free failure (the property simply does not exist as a setter).
- [ ] `syncWrite` and `HasOnePersistedAssignmentError` are deleted, with their
      tests removed or converted to cover `set#{Name}`.
- [ ] `pnpm parity:api:extra --package activerecord` drops `HasOnePersistedAssignmentError`.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls` clean; any baseline row naming a
      deleted method is removed by hand, not reseeded.
