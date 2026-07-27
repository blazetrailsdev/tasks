---
title: "converge-foreign-key-derivation-single-site"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails derives a foreign association's owner FK in exactly one place —
`reflection.foreign_key`, keyed on `reflection.active_record` (the class that
_declared_ the association), see
`vendor/rails/activerecord/lib/active_record/reflection.rb` and
`associations/foreign_association.rb`.

trails re-derives it in three separate places, each with its own copy of the
`options.foreignKey` → rich reflection → `as:` → `underscore(ctor.name)_id`
ladder:

- `packages/activerecord/src/associations/collection-association.ts:885`
  (`foreignKeyColumns`)
- `packages/activerecord/src/associations/has-one-association.ts:465`
  (`foreignKeyColumns`) — only pointed at the rich reflection in #5356; before
  that it derived from the owner _instance's_ class and produced
  `special_post_id` for an STI owner.
- `packages/activerecord/src/associations.ts:1648`
  (`ownerReflectionForeignKey`, the free-function engine path)

The has_one copy drifted for as long as it existed and was only caught when a
dead duplicate that encoded the correct rule was deleted (#5356). The other two
can drift the same way.

## Acceptance criteria

- A single FK-derivation helper, in the Rails-layout file that matches where
  Rails resolves it (`ForeignAssociation` / the reflection), is used by the
  collection, has_one, and engine paths.
- The per-class `foreignKeyColumns` copies are deleted, not left as wrappers
  that re-implement the ladder.
- `packages/activerecord/src/associations/sti-owner-through-foreign-key.test.ts`
  (both the has_many :through and has_one cases) still passes, plus the has_one,
  belongs_to, autosave, and nested-attributes suites.
- No behavior change intended — this is a dedupe, so no test renames and no new
  Rails-named tests.
