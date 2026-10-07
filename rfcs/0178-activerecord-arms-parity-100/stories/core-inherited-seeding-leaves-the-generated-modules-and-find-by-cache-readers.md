---
title: "activerecord: Core's inherited seeding leaves generatedAssociationMethods and cachedFindByStatement"
status: blocked
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps:
  - active-record-base-inherited-chain-needs-one-deferred-dispatch
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8626
claim: "2026-10-07T12:33:14Z"
assignee: "migration-command-line-messages-print-the-trails-spelling-and-rails-env-arms"
blocked-by: "Needs one owner-decided mechanism for Base's inherited chain (active-record-base-inherited-chain-needs-one-deferred-dispatch); a Core-only first-read trigger was tried in trails#8626 and backed out in review"
closed-reason: null
---

## Context

Rails' `Core::ClassMethods#inherited`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:412-430`) runs at
class definition: it calls `subclass.initialize_find_by_cache` and, through
`AttributeMethods::ClassMethods#inherited`, `initialize_generated_modules`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:59-63`),
which builds the attribute-methods module before the association one. JS has no
hook that fires when a subclass is defined, so `packages/activerecord/src/core.ts`
defers both to first use:

- `generatedAssociationMethods` (`core.rb:338-346`, `@generated_association_methods ||= begin … end`)
  first tests for an own `_generatedAttributeMethods` and calls
  `initializeGeneratedModules()`. Without it an association reader loses to the
  attribute reader of the same name (`associations.test.ts` "association
  methods override attribute methods of same name", `fixtures.test.ts`
  "ignores belongs to symbols if association and foreign key are named the same").
- `cachedFindByStatement` (`core.rb:403-406`) reads
  `own _findByStatementCache || this.initializeFindByCache()`, one `||` and one
  call Rails' body does not have.

Both carry `@inventedArm … — CONVERGEABLE <this story>`. CLAUDE.md § "`inherited`
is deferred to own-property memo guards" ratifies the own-property guard for
`ModelSchema` only.

## Acceptance criteria

- [ ] Either both bodies take Rails' shape (the seeding moved to wherever the
      repo settles `Core`'s `inherited`), or CLAUDE.md's `inherited` section is
      extended by the repo owner to cover `core.rb:412-430` and the receipts
      become `PERMANENT`.
- [ ] `pnpm parity:api:arms:throws` is green.
- [ ] The two tests named above still pass.
