---
title: "rails-private-methods.json misses mixin re-declaration sites, forcing @noRailsEquivalent receipts on Rails-private members"
status: in-progress
updated: 2026-08-28
rfc: "0121-internal-tag-accounting"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 7150
claim: "2026-08-28T11:37:09Z"
assignee: "privates-manifest-misses-mixin-redeclaration-sites"
blocked-by: null
closed-reason: null
---

## Context

PR #7057 (`privates-manifest-keys-by-file-not-entity`) fixed the FALSE POSITIVE
direction: a private name on one Ruby entity no longer over-tags a same-named
member of an unrelated type sharing the TS file. This story is the FALSE
NEGATIVE direction it left behind, surfaced by PR #7084 while enrolling
`activemodel` / `activesupport` in `unbacked-internal-needs-receipt`.

`scripts/build-rails-privates-manifest.ts` keys a private name by the `.rb` the
member is **declared** in. Ruby, though, hands the same private method to other
classes by `include` / `extend`, and trails must re-state it at the receiving
site (`declare static x: typeof x`). That re-declaration is a public TS
declaration in a DIFFERENT file, so the manifest cannot back it, and
`unbacked-internal-needs-receipt` demands a `@noRailsEquivalent` receipt for a
member that plainly has a Rails equivalent — it is just private, elsewhere.

PR #7084 had to write six such receipts, each of which is debt this story
retires:

- `packages/activemodel/src/model.ts` — `pendingAttributeModifications`,
  `resetDefaultAttributesBang`, `resolveAttributeName`, `resolveTypeName`,
  `hookAttributeType`. All private on
  `ActiveModel::AttributeRegistration::ClassMethods`
  (`activemodel/lib/active_model/attribute_registration.rb:77`, `:96`, `:101`,
  `:105`, `:112`), reaching `Model` by `extend`. The definition site,
  `attribute-registration.ts`, IS manifest-backed — only the `model.ts`
  re-declaration is not.
- `packages/activesupport/src/test-case.ts` — `taggedLogger`, private on
  `ActiveSupport::Testing::TaggedLogging`
  (`activesupport/lib/active_support/testing/tagged_logging.rb:22`), reaching
  `TestCase` by `include` (`test_case.rb:144`).

A second, narrower miss showed up beside it: the manifest carries NO row at all
for `packages/activesupport/src/testing/tagged-logging.ts`, the file that
actually declares `taggedLogger`. That is a plain file-mapping gap, not a mixin
one, and belongs in the same fix.

Related but distinct, and deliberately NOT in scope here: a name that is private
on one entity and PUBLIC on another in the same `.rb` (Rails'
`ActiveModel::Attributes#attribute`, `attributes.rb:161`, private, versus
`Attributes::ClassMethods#attribute`, `attributes.rb:59`, public). The builder
folds those to "not private" and the receipt on
`packages/activemodel/src/attributes.ts` records it — file separately if this
story's shape does not already resolve it.

## Converged shape

Back a private Ruby name at every TS site that legitimately re-states it, not
only at the declaring file:

1. Resolve each Ruby entity's `include` / `extend` list (already extracted into
   `rails-api.json` as `includes` / `extends`) and propagate the entity's
   private names to the TS files mapped to the INCLUDING entities.
2. Add the missing `testing/tagged-logging.ts` row — check whether
   `rubyFileToTs` or `PACKAGE_DIRS` is dropping `testing/tagged_logging.rb`.
3. Delete the six now-unnecessary `@noRailsEquivalent` receipts PR #7084 added,
   leaving the bare `@internal` the manifest then backs.

## Acceptance criteria

- [ ] `eslint/rails-private-methods.json` backs `pendingAttributeModifications`,
      `resetDefaultAttributesBang`, `resolveAttributeName`, `resolveTypeName`
      and `hookAttributeType` for `packages/activemodel/src/model.ts`, and
      `taggedLogger` for BOTH `packages/activesupport/src/test-case.ts` and
      `packages/activesupport/src/testing/tagged-logging.ts`.
- [ ] The six `@noRailsEquivalent` receipts naming "the manifest keys private
      names by the .rb the member is DECLARED in" are deleted, and
      `pnpm exec eslint --no-inline-config -c eslint/rails-private-jsdoc.config.mjs
"packages/activemodel/src/**/*.ts" "packages/activesupport/src/**/*.ts"`
      is still clean.
- [ ] `pnpm exec tsx scripts/api-compare/extra-surface.ts` exits 0 — no tag goes
      STALE as a result.
- [ ] `blazetrails/rails-private-jsdoc` gains no new violations (the propagation
      must not over-tag; that is what #7057 fixed).
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
