---
title: "Strict-loading violation check lives in the singular reader, not find_target"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails raises strict-loading violations from `Association#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248-251`,
guard at `:284-291`), so **every** path that issues the association's query
raises — the reader, `load_target`, and anything else that reaches `find_target`.

trails instead puts the check in the singular _reader_
(`packages/activerecord/src/associations/singular-association.ts:210-222`,
`_isStrictOnOwner`) and leaves `findTarget` / `loadTarget` unguarded. Any caller
that loads without going through the reader silently lazy-loads a strict-loaded
owner's association.

Surfaced concretely in PR #5643: the nested-attributes one-to-one writer called
`assoc.loadTarget()` directly and bypassed the check entirely, lazy-loading and
then mutating the child of a strict-loaded owner. That call site was fixed by
routing through `assoc.reader` (which is also the faithful port of Rails'
`existing_record = send(association_name)`), but the underlying placement
divergence is untouched and the next non-reader caller will reproduce it.

Note the placement is not cosmetic: Rails' `violates_strict_loading?` also
consults `owner.validation_context.nil?` and the `@skip_strict_loading` flag,
neither of which the trails reader-side check models.

## Acceptance criteria

- [ ] The strict-loading violation check moves to (or is additionally enforced
      at) trails' `findTarget`, matching `association.rb:248-251`, so a
      non-reader load path cannot bypass it.
- [ ] `violates_strict_loading?`'s `validation_context` and `skip_strict_loading`
      factors are ported or their absence explicitly justified at the call site.
- [ ] A regression test loads a strict-loaded owner's association via a
      non-reader path and asserts it raises; verified failing on the baseline.
- [ ] `strict-loading-sync-reader.test.ts` still passes (the reader-side
      behavior is preserved, not relocated out from under it).
