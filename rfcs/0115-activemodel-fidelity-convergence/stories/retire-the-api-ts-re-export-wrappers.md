---
title: "retire api.ts's re-export wrappers and raiseOnMissingTranslations"
status: claimed
updated: 2026-08-26
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-08-26T23:54:56Z"
assignee: "trim-active-model-model-to-api-and-access"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/api.ts:77-84` defines a function Rails does not have:

```ts
export function raiseOnMissingTranslations(value?: boolean): boolean {
  return translationRaise(value);
}
```

Its own JSDoc states the reason it exists — "`ActiveModel::API` includes
Validations, which extends Translation, so `API.raise_on_missing_translations`
reaches the Translation singleton accessor (translation.rb:25). Surface the same
accessor here so callers can read/write it via `API.raiseOnMissingTranslations(…)`."
That is a re-export wrapper standing in for Ruby's method lookup, not a port:
`vendor/rails/activemodel/lib/active_model/translation.rb:25` declares
`mattr_accessor :raise_on_missing_translations, default: false` on
`ActiveModel::Translation` and `api.rb` never mentions it. After PR #7099 taught
`collectAllowedNames` to follow the Concern hook, this is the ONLY name left
scoring `moved` on `api.ts` (0 novel, 1 moved), so it is now isolated.

The same file also carries eight `export const x = y` re-exports
(`initInternals`, `contextForValidation`, `runValidationsBang`,
`raiseValidationError`, `_mergeAttributes`, `_assignAttributes`,
`_assignAttribute`, `sanitizeForMassAssignment`) whose block comment gives the
same justification — "Re-export the canonical helpers so api-compare matches the
shape of `api.rb`". `api.rb` declares none of them; they reach an includer
through `include ActiveModel::Validations` / `AttributeAssignment`
(`vendor/rails/activemodel/lib/active_model/api.rb:61-63`), which is the
`walkMixin` chain, not a re-export. They score allowed today only because the
allow-set credits them via that chain — the re-export is doing no work.

`api.ts` also opens with an `interface API { isPersisted(): boolean }` whose
comment says "Model already implements this; this interface codifies the
contract" — no Ruby counterpart; `ActiveModel::API` is a Concern with
`initialize` and `persisted?` (api.rb:80-97), and its trails port lives on
`Model`.

## Acceptance criteria

- `raiseOnMissingTranslations` is deleted from `api.ts`; callers read the
  accessor where Rails does, on the Translation port
  (`packages/activemodel/src/translation.ts`), matching translation.rb:25.
- The eight re-export `const`s are deleted, with each importer pointed at the
  defining module (`validations.ts`, `validations/helper-methods.ts`,
  `attribute-assignment.ts`, `forbidden-attributes-protection.ts`) — the same
  files Ruby's include chain reaches.
- The `interface API` shape is deleted or reduced to the `initialize` /
  `persisted?` pair `api.rb:80-97` actually declares.
- `pnpm parity:api:extra --package activemodel` reports `api.ts` at
  0 novel / 0 moved.
- activemodel and activerecord suites green; parity deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
