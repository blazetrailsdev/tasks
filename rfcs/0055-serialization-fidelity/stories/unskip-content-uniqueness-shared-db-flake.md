---
title: "unskip-content-uniqueness-shared-db-flake"
status: ready
updated: 2026-07-08
rfc: "0055-serialization-fidelity"
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

Un-skip the 5 content-uniqueness tests skipped by PR #4738
(serialized-cast-mutable-serialize-first) and fix the underlying shared-DB
flake that makes them fail on CI.

Skipped tests in `packages/activerecord/src/validations/uniqueness-validation.test.ts`:

- `validate uniqueness with scope` (line ~226)
- `validate uniqueness with aliases` (line ~245)
- `validate uniqueness with object scope` (line ~268)
- `validate uniqueness with composed attribute scope` (line ~298)
- `validate uniqueness scoped to defining class` (line ~323)

All five validate uniqueness on `Reply.content`, which is a `serialize`-wrapped
column (`test-helpers/models/topic.ts:94 this.serialize("content")`; Reply is STI
on topics). They pass in isolation and in the full suite locally (all fork
counts, cold/warm cache), but fail on CI with
`AssertionError: expected true to be false` — a just-persisted `r1` (via
`replies.create`, whose `isPersisted()` assertion passes) is not seen by `r2`'s
uniqueness query, so the collision is missed and `save()` returns `true`.

Root-cause analysis in PR #4738 (see
[memory: project_uniqueness_validation_content_shared_db_flake]) ruled out the
serialized-cast change as causal: the uniqueness query
(`validations/uniqueness.ts:405-409`) and persistence both call
`type.serialize()` (unchanged by #4738), the YAML round-trip
`"hello world" ↔ "hello world\n"` is idempotent, there is no coder leak
(`Reply.content` always serializes to `"hello world\n"`), and there is no schema
drift (r1 inserts fine). The failure is a pre-existing shared-DB / decorator
loading fragility whose manifestation depends on CI's per-worker runtime
interleaving; #4738's test-file edits shifted that interleaving enough to trip
it deterministically on CI while remaining green on main. The identical failure
signature has hit at least 6 unrelated PRs historically (PRs 2025, 2229, 2230,
2237, 2240, 2278).

The suspected mechanism to confirm: when `uniqueness-validation.test.ts`
co-schedules in a fork worker with a file that leaves `Reply`/`Topic` in a state
where the `content` serialize decorator is not loaded (`uniqueness.ts:408`
`decorated.coder` falsy), the query binds the raw `"hello world"` instead of the
serialized `"hello world\n"`, missing the collision. A `beforeAll` canonical
schema warm/rebuild in the victim file (the documented shield pattern, cf.
`dirty.test.ts` mysql:8 shield) is the likely fix — but confirm the mechanism
first (it is not locally reproducible; reproduce on CI or by forcing an
unwarmed `Reply` decorator).

## Acceptance criteria

- [ ] Root cause of the `r1`-invisible-to-`r2` content-uniqueness failure
      confirmed (decorator-not-loaded or connection-visibility), documented in
      the story/PR.
- [ ] The 5 tests above are un-skipped (`it.skip` → `it`) and pass on CI across
      SQLite, PostgreSQL, and MariaDB, including under the fork scheduling that
      exposed the flake.
- [ ] Fix is in test infra / decorator-loading, not by weakening the
      assertions or renaming tests (test names must stay Rails-verbatim).
- [ ] No regression to the serialized-content behavior shipped by #4738.
