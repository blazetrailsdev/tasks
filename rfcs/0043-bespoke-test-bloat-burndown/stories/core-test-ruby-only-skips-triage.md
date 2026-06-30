---
title: "Triage 11 Ruby-only CoreTest skips: delete-as-bloat vs keep"
status: claimed
updated: 2026-06-30
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-06-30T15:39:39Z"
assignee: "core-test-ruby-only-skips-triage"
blocked-by: null
---

## Context

PR #4316 converged `core.test.ts` to a faithful port of
`activerecord/test/cases/core_test.rb`. 11 cases were left as `it.skip` with
reasons because they exercise Ruby-runtime facilities trails has no counterpart
for (not trails impl gaps — those are tracked separately under
0023-surfaced-deviations):

- `pretty print *` ×7 — Ruby `PP` pretty-printer rendering.
- `composite pk models added to a set` — Ruby `Set` membership via hash/eql?.
- `composite pk models hash` — Ruby `Object#hash`.
- `inspect singleton instance` — Ruby `singleton_class`.
- `inspect instance with lambda date formatter` — `Time::DATE_FORMATS` registry.

They currently sit as documented skips (keeps the Rails test names visible to
test:compare). Owner question raised during review: keep them as documented
skips, or delete them as bespoke-test bloat per this RFC.

## Acceptance criteria

- Decide keep-as-skip vs delete for the 11 Ruby-only CoreTest cases in
  `packages/activerecord/src/core.test.ts`.
- If deleting, remove them and note the test:compare impact; if keeping, no code
  change (close as ratified with rationale).
