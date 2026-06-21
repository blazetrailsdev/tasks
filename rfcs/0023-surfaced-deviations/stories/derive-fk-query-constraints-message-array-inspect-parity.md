---
title: "deriveFkQueryConstraints/_inlinePolymorphicKeys render query_constraints array as Ruby inspect in ArgumentError message"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3768
claim: "2026-06-21T02:54:41Z"
assignee: "derive-fk-query-constraints-message-array-inspect-parity"
blocked-by: null
---

## Context

The "couldn't correctly interpret the query constraints" ArgumentError message
interpolates the query_constraints list directly via `${...}`, which renders a
JS array as `blog_id,id`. Rails' `#{primary_query_constraints}`
(reflection.rb:872) renders the Ruby array as `["blog_id", "id"]`.

This affects BOTH ports, which were deliberately kept in lockstep (PR #3751):

- `deriveFkQueryConstraints` — reflection.ts:857 (`${primaryQueryConstraints}`)
- `_inlinePolymorphicKeys` — associations.ts (`${qc}`)

Non-behavioral and off any currently tested path, so it was not fixed inline to
avoid diverging the two ports. Tracked here so the bracket/quote parity can be
fixed in both sites together.

Rails ref: vendor/rails/activerecord/lib/active_record/reflection.rb:870-876

## Acceptance criteria

- [ ] Both `deriveFkQueryConstraints` and `_inlinePolymorphicKeys` render the
      query_constraints list in the "couldn't correctly interpret" ArgumentError
      message as `["blog_id", "id"]` (matching Rails' array inspect), not
      `blog_id,id`.
- [ ] A test asserts the exact message string for the uninterpretable-keys case.
