---
title: "collapse-user-provided-and-source-onto-the-rails-kwarg"
status: done
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6783
claim: "2026-08-20T18:35:07Z"
assignee: "collapse-user-provided-and-source-onto-the-rails-kwarg"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activemodel` scores
`packages/activemodel/src/attributes.ts` at 2 novel, and both rows are the
same idea stored twice on `AttributeDefinition` / `AttributeOptions`:

- `userProvided?: boolean` (`attributes.ts:48`)
- `source?: "user" | "schema"` (`attributes.ts:50`), whose own JSDoc says
  _"Provenance tag — matches `userProvided` but kept explicit for clarity"_
- `userProvidedDefault?: boolean` (`attributes.ts:101`), the option key that
  feeds both

Rails stores none of them. `user_provided_default:` is a **kwarg** on
`define_attribute` / `_default_attributes`
(`activemodel/lib/active_model/attribute_registration.rb`,
`activerecord/lib/active_record/attributes.rb`); the distinction it draws is
carried by which `Attribute` subclass gets built
(`Attribute::UserProvidedDefault` vs `Attribute.from_database`), not by a
persisted flag on a definition record.

`converge-attributes-define-method-attribute-and-defaults` (PR #6780) got the
file from 3 novel to 2 by deleting the callerless `buildDefaultAttributes`,
but could not reach its "≤ 1 novel" bar without this: the pair has 25+ call
sites outside activemodel —
`activerecord/src/model-schema.ts:969,1141,1148,1190,1435`,
`activerecord/src/enum.ts:163`,
`activerecord/src/encryption/encryptable-record.ts:174`,
`activerecord/src/attributes.ts:29,194` — plus assertions in
`model-schema-load.test.ts`, `model-schema-sync-load.test.ts` and
`sti-attribute-routing.trails.test.ts` that read `userProvided` directly.

## Acceptance criteria

- `userProvided` and `source` collapse to one representation, or both go away
  in favour of the `Attribute` subclass distinction Rails uses.
- `pnpm parity:api:extra --package activemodel` shows `attributes.ts` at
  ≤ 1 novel.
- The AR schema-reflection precedence rule they encode (a user-declared
  attribute is never overwritten by `load_schema`) is preserved — see
  `model-schema.ts:1265`.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.
