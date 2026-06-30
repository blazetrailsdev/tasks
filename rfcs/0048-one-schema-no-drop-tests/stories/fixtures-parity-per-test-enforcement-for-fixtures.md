---
title: "fixtures-parity-per-test-enforcement-for-fixtures"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

> **SUBSUMED by PR #4347** (close on its merge). #4346 already moved `fixtures`
> into `ACCESSOR_HELPERS`; PR #4347 adds the generator-regex fix (`(?<!\.)`
> lookbehind in `buildAccessorRe`) + regenerated map, dropping the
> `.references(...)` false positives (incl. eager_test.rb:202/:1398) so per-test
> enforcement holds without excluding `eager.test.ts`. Do NOT claim this.

## Context

`fixtures()` (the unified Rails-faithful surface, test-helpers/fixtures.ts) is
currently registered in `TRANSACTIONAL_HELPERS` in
`eslint/test-fixture-parity.mjs:195`, not `ACCESSOR_HELPERS`. This is correct
for fidelity today: `fixtures()` always wraps the transactional handler path
and is the unified replacement for the old
`useHandlerTransactionalFixtures()` + `useFixtures(...)` pairing, so the
class-level fallback (whole-scope exempt) matches Rails' class-level
`fixtures :name`.

The downside flagged in review (PR #4347): under `TRANSACTIONAL_HELPERS`, the
_per-test_ accessor-usage check is skipped for the entire scope. A test that
destructures `const { topics } = fixtures([...])` but whose body never calls
`topics(...)` — when its Rails counterpart DOES name that fixture — passes
silently. Moving `fixtures` to `ACCESSOR_HELPERS` would restore per-test
enforcement BUT produces false positives on two tests at PR #4347 HEAD:
`eager_test.rb:202` and `eager_test.rb:1398`. Neither names a fixture row in
Rails — they only LOOK fixture-using because of a **generator-regex collision**:

- `scripts/generate-fixture-parity-map.ts` builds an accessor regex
  `\b(<fixtureNames>)\s*\(` from the class-level `fixtures :…` list. eager_test.rb:54
  declares `:references` as a fixture set, so the regex matches **any** `references(`
  token — including the ActiveRecord query method `.references(:post)` /
  `.references(:mentors)`, which is NOT a fixture-row accessor. The `\b` word
  boundary does not exclude a preceding `.`, so both tests get marked
  fixture-using in `eslint/test-fixture-parity.json` despite using no accessor.

This is the documented imprecision the generator header (lines 13–19) calls out.
So the real blocker to per-test enforcement is the mapping, not the rule bucket:
`fixtures` cannot move to `ACCESSOR_HELPERS` until these false-positive entries
are gone.

This concern compounds as `fixtures-rename-handler-callsites` converts
`useHandlerFixtures` (today in `ACCESSOR_HELPERS`) → `fixtures()`.

## Acceptance criteria

- [ ] Fix the generator accessor regex so a member-call AR query method
      (`.references(...)`, etc.) is not mistaken for a bare fixture-row accessor
      (`references(:label)`) — e.g. a negative lookbehind `(?<![.\w])` in
      `buildAccessorRe` — and regenerate `eslint/test-fixture-parity.json`.
      Verify `eager_test.rb:202`/`:1398` drop out and no legitimate bare-accessor
      entries are lost.
- [ ] Then move `fixtures` to `ACCESSOR_HELPERS` (per-test accessor enforcement),
      restoring the gate strength the rename campaign needs.
- [ ] `eager_test.rb:202` and `eager_test.rb:1398` (and equivalents) stay green
      without whole-file excluding `associations/eager.test.ts`.
- [ ] Rule test cases cover: destructured-but-unused accessor → warns;
      Rails-faithful zero-named-fixture test in an accessor-destructuring scope →
      passes.
- [ ] No test names change; test:compare non-negative.
