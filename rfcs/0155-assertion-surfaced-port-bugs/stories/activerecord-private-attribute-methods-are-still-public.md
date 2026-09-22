---
title: "activerecord-private-attribute-methods-are-still-public"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
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
