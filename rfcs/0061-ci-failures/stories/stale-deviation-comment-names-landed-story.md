---
title: "Flag deviation comments that name an already-landed convergence story"
status: done
updated: 2026-08-03
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5984
claim: "2026-08-03T16:09:42Z"
assignee: "stale-deviation-comment-names-landed-story"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/message-verifier.test.ts` carried a deviation
comment that named the story which would converge it:

```ts
// Trails' encoder has no `time_precision` knob and leans on
// `Temporal.Instant#toJSON`, which drops a zero subsecond part.
// Converged by the `activesupport-json-encoding-time-precision` story.
const exp = { foo: 123, bar: "2010-01-01T00:00:00Z" };
```

That story shipped as #5971 (`Encoding.timePrecision` wired into `json.ts:104`
and `time-with-zone.ts:530`), so the encoder started emitting Rails' three
subsecond digits — but the test still asserted the pre-convergence value and
went red on `main`. Nothing connected the landing story to the sites that named
it; the break surfaced only as a Unit Tests failure on `main`, fixed in #5976.

This is a general class: a deviation comment naming a story slug is a promise
that goes unchecked when that story closes. Other such comments exist across
the tree (grep for `Converged by the` / story slugs in comments).

Rails anchor for the instance already fixed:
`vendor/rails/activesupport/test/message_verifier_test.rb:109` —
`exp = { "foo" => 123, "bar" => "2010-01-01T00:00:00.000Z" }`.

## Acceptance criteria

- A check (lint rule or a `scripts/` unit test, alongside the existing
  deviation-register gates) that extracts story slugs referenced in code and
  test comments and fails when a referenced story is `done`/`closed` while the
  comment is still present.
- Existing referenced-but-landed comments are either converged or the reference
  is corrected, so the check starts green.

## Definition of done

- Check runs in the Unit Tests lane and is green on `main`.
- No comment in the tree names a story that has already landed.

## Verification

- Re-introduce the pre-#5976 `message-verifier.test.ts` comment locally and
  confirm the check fails on it.
