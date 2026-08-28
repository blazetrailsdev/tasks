---
title: "receipt-gates-require-permanent-bare-or-convergeable-story"
status: ready
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
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

A deviation receipt (`@noRailsEquivalent`, `@missingRailsCall`,
`@missingRailsArgs`) has exactly two legitimate shapes:

- `PERMANENT` — a language- or runtime-level fact no port can remove. The
  token is the whole receipt; there is nothing to say after it.
- `CONVERGEABLE <story-id>` — work not done yet. The story is the receipt;
  the tag's only job is to point at it.

`classifyReason` (`scripts/api-compare/missing-rails-call-tags.ts:304-308`)
reads the leading token and ignores the rest, so today a `CONVERGEABLE` with
no story, or with prose instead of a story, passes every gate
(`parity:api:extra`, `parity:api:extra:gate`, `parity:api:calls`,
`parity:api:calls:args`). PR #7132 (`9415a63a9`) stripped the free text off
244 tags repo-wide; for the `PERMANENT` ones that was the right result
(e.g. `packages/arel/src/nodes/sql-literal.ts:22,28,41`, `table.ts:20`,
`temporal-tag.ts:1` are now exactly `/** @noRailsEquivalent PERMANENT */`),
but for a `CONVERGEABLE` it also removed the `(story <id>)` back-reference
that was the only link to the owning work — e.g. the
`@missingRailsCall build_statement_pool — CONVERGEABLE (story
abstract-adapter-constructor-drops-rails-config-arg)` case quoted in
`no-freeform-comments-deletes-call-site-deviation-receipts` (RFC 0124) went to
a bare `CONVERGEABLE` and nothing noticed.

The story-id half already has infrastructure: the stale-story-refs check
resolves story ids cited in code against the tasks DB, and
`lint-call-mismatches.ts:598-620` already splits the report into
"CONVERGEABLE by file" / "PERMANENT but names a convergence owner".

## Acceptance criteria

- `classifyReason` (or a companion) validates the _whole_ reason against the
  two shapes: `PERMANENT` followed by nothing (trailing punctuation/whitespace
  tolerated), or `CONVERGEABLE` followed by exactly one story id that exists
  in the tasks DB and is not `done`/`closed`. Anything else — a bare
  `CONVERGEABLE`, a `CONVERGEABLE` with prose, a `PERMANENT` with prose, a
  story id that does not resolve — is `malformed`.
- `extra-surface.ts` fails the run on any `malformed` tag, the way it fails
  on `unclassified` today (hard 0, no ratchet, no reseed), naming file:line
  and which shape was violated. `missing-rails-call-tags.ts` and
  `missing-rails-args-tags.ts` apply the same check to their tags.
- Unit tests pin all six cases above.
- CLAUDE.md's four "reason" sentences are rewritten to describe the two
  shapes, so a bare `PERMANENT` is documented as complete and a
  `CONVERGEABLE` is documented as "the story id, nothing else".
- The 0124 story `no-freeform-comments-deletes-call-site-deviation-receipts`
  is re-scoped against this: restoration is only of the story ids on
  `CONVERGEABLE` tags, not of prose; `Mirrors:` lines are a separate
  decision. On landing, the run is red at every `CONVERGEABLE` tag that lost
  its story id in #7132 and at no `PERMANENT` tag.
