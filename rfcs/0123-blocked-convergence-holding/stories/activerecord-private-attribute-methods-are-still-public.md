---
title: "activerecord-private-attribute-methods-are-still-public"
status: closed
updated: 2026-10-01
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-23T14:33:22Z"
assignee: "activemodel-respond-to-cannot-hide-private-methods"
blocked-by: null
closed-reason: 'Owner decision landed by trails#8317: no JS runtime privates (CLAUDE.md § "Method visibility is compile-time only"). trails carries no method visibility at run time, so the four access-control tests (attribute_methods_test.rb:998-1033) are permanently unportable: parked as PERMANENT-SKIP citing that section and registered in scripts/parity/unported-files.'
---

## Context

Surfaced parking `attribute_methods_test.rb` for `park-0155-owned-activerecord-residue`.
Rails' `privatize` helper (`vendor/rails/activerecord/test/cases/attribute_methods_test.rb:1599-1606`)
defines a `private` reader / writer / predicate over a column, and four tests assert Ruby's
visibility semantics on it:

- `attribute readers respect access control` (`:998-1006`), `attribute writers respect access control`
  (`:1008-1016`), `attribute predicates respect access control` (`:1018-1026`) —
  `assert_not_respond_to`, `assert_raise(NoMethodError)` whose message includes `"private method"`,
  and `send` reaching the private member.
- `bulk updates respect access control` (`:1028-1033`) — mass assignment through a private writer
  raises `ActiveRecord::UnknownAttributeError`, because `_assign_attribute`
  (`activemodel/lib/active_model/attribute_assignment.rb`) uses `public_send` and rescues
  `NoMethodError`.

In trails the ported `private` accessor is a TS compile-time annotation, so `respondTo` still
answers true (see `activemodel-respond-to-cannot-hide-private-methods`), a call does not raise, and
mass assignment goes through the writer. Converged bodies are parked in
`packages/activerecord/src/attribute-methods.test.ts` with `BLOCKED:` lines naming this story.
CLAUDE.md § "Method visibility is not a runtime fact in JS" is the relevant ratification.

## Acceptance criteria

- The RFC owner decides: either a runtime visibility carrier for generated/overridden attribute
  members lands (respond_to?, NoMethodError "private method", `public_send` in assignment) and the four
  tests are un-skipped and pass, or the story is closed with the four tests converted to
  `PERMANENT-SKIP` citing that section.
