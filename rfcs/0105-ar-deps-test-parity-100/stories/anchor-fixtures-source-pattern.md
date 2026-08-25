---
title: "Anchor the unported `fixtures.rb` source pattern so it stops shadowing two siblings"
status: done
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: boundary-and-measurement
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6505
claim: "2026-08-14T02:27:09Z"
assignee: "derive-ar-closure-test-manifest"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/unscoped.ts:77-82` carries
`pattern: "fixtures.rb"`. `isSourceUnported`
(`scripts/parity/unported-files/index.ts:36-43`) treats a pattern without a
leading `/` as a plain substring, so this row also matches
`activerecord/lib/active_record/test_fixtures.rb` and
`activerecord/lib/active_record/encryption/encrypted_fixtures.rb` — the known
unported-substring-shadow trap. The anchored form (`/fixtures.rb`) exists in the
grammar at the same `index.ts:36-43` and is not used here.

Precision matters for what this does and does not affect: the shadow is on the
`pattern` field, which feeds the **api-compare source axis**. The `testFile`
field on the same row is already anchored (`/fixtures_test.rb`), so the
test-gate denominator is not affected by the shadow — the separate, larger
finding about that row (the stale reason hiding 172 AR tests) is RFC 0023's
`reenroll-fixtures-tests-stale-unported-exclusion`, not this story. This story
is the one-line anchoring plus a sweep for siblings with the same defect.

## Acceptance criteria

- The row's `pattern` is anchored (`/fixtures.rb`), and `test_fixtures.rb` /
  `encryption/encrypted_fixtures.rb` are covered only by their own rows (which
  already exist at `unscoped.ts:93-105`) or not at all.
- A sweep of every entry in `scripts/parity/unported-files/*` for unanchored
  basename patterns that are proper substrings of another vendored Rails source
  path; each hit is either anchored or filed as its own story with the Rails
  path that shadows it.
- `pnpm parity:api` deltas are non-negative, and any member that becomes visible
  because a shadow lifted is reported in the PR body rather than re-hidden.
