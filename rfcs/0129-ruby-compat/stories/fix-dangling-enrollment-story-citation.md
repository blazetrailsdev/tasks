---
title: "fix-dangling-enrollment-story-citation"
status: in-progress
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 22
pr: 7307
claim: "2026-08-31T19:35:25Z"
assignee: "enroll-call-mapping-i18n-and-activesupport"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/report-ruby-compat.ts:16` names the enrollment story as
`enroll-call-mapping-in-parity-gate`. **That story does not exist** —
`pnpm tasks show enroll-call-mapping-in-parity-gate` errors "not found". The
enrollment work is actually split across two stories that DO exist:

- `enroll-call-mapping-i18n-and-activesupport`
- `enroll-call-mapping-remaining-packages`

The slug came from the `ruby-core-call-mapping-table` story prose, which named a
single enrollment story that was later split. It landed in #7294.

`scripts/stale-story-references.ts` does not catch it: the guard requires a
PENDING_PHRASE in the same sentence, and this sentence ("so the flip is its own
story") matches none of them. So it is a silent wrong reference, not a red lane —
which is exactly why it is worth a story rather than a note.

## Acceptance criteria

- `report-ruby-compat.ts`'s doc cites the two real enrollment story ids, or
  drops the citation.
- `pnpm tasks show <id>` resolves for every story id cited in that file.
