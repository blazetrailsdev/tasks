---
title: "Stale-story guard ignores the RFC name written beside the slug"
status: draft
updated: 2026-08-28
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: ["activerecord", "activesupport"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/stale-story-references.ts` checks that a story slug cited as _pending_
in a comment is not already `done`/`closed`. It does not check the **RFC or
bucket name written next to the slug**, because it matches on the slug alone
(`STORY_SLUG`, `scripts/stale-story-references.ts:16`).

PR #7164 (which re-homed 592 stories out of `0023-surfaced-deviations` into
per-package buckets) surfaced how much that costs. Of nine slug-bearing in-code
citations touched, **four named the wrong RFC and nothing detected it**:

- `packages/activerecord/src/enum.test.ts:14,88,192` — `enum-canonical-book-gaps`
  is `0050-enum-fidelity`, `done`; the comment said RFC 0023 (and pre-dated the PR).
- `packages/activerecord/src/query-cache.test.ts:931` — `query-cache-dirties-wiring-incomplete`,
  0023, `done`.
- `packages/activerecord/src/associations/has-one-associations.test.ts:398` —
  `belongs-to-sync-read-direct-destroy-callback`, 0023, `done`.
- `packages/activesupport/src/notifications/instrumenter.ts:300` —
  `get-crypto-sync-auto-registration-has-no-esm-arm` is
  `0113-branch-and-guard-parity`, `ready`; the comment said 0023.

Each was found by hand-resolving the slug against `tasks/rfcs/*/stories/`. Every
story move re-stales every citation of it, silently, and the per-package bucket
split just moved 592 of them at once.

## Acceptance criteria

- `staleStoryReferences` (or a sibling in the same module) also reports a
  citation whose written RFC/bucket name disagrees with the story's actual
  `rfc_id`, resolved the same way the existing scan resolves status.
- The check recognises the spellings already in the tree: `RFC <number>-<slug>`,
  `RFC <number>`, `<number>-<slug>/<story-slug>`, `<package>-surfaced-deviations`,
  and a bare `<bucket>/<story-slug>` path.
- A citation carrying no RFC/bucket name at all is not a finding — naming the
  story alone stays legal.
- `scripts/stale-story-references.test.ts` covers a right-slug/wrong-RFC case and
  a bare-slug case, and the whole trees passes.
