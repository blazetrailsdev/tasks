---
title: "convert-residual-test-connection-call-sites"
status: ready
updated: 2026-07-27
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps:
  - route-fixture-machinery-off-deprecated-getter
  - resolve-model-schema-reflection-adapter-fallback
deps-rfc: []
est-loc: 90
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The residual test-file call sites that reach the `permanentConnectionCheckout`
gate, once stories A and B have removed the helper and production sources.
Re-measured after story A (#5349) landed: **38 sites across 28 files**, 46 hits.
The helper self-tests are no longer in scope — story A converted them.

Story A converted the two helper self-test files that passed the connection
thunk explicitly (`use-fixtures.test.ts`, `repair-validations.test.ts`). Four
helper self-test sites remain and ARE in scope here, because they read the getter
for their own purposes rather than as a fixture thunk:
`use-transactional-tests.test.ts:19` (a raw-SQL accessor whose file docstring
says it proves isolation "on the Base.connection path" — read that intent before
changing it), `with-transactional-fixtures.test.ts:20`,
`naked-fixtures.test.ts:52`, `handler-resolved-adapter.test.ts:39`.

The 34 real test sites:

```text
associations/cp-count-disable-joins-through.test.ts:28:36
associations/disable-joins-association-scope.test.ts:10:36
associations/disable-joins-composite-key.test.ts:25:36
associations/disable-joins-composite-nested.test.ts:38:36
associations/disable-joins-nested-through.test.ts:29:36
associations/disable-joins-polymorphic-nonid-pk.test.ts:130:16
associations/disable-joins-polymorphic-nonid-pk.test.ts:69:23
associations/disable-joins-routing-widening.test.ts:28:36
associations/eager-singularization.test.ts:24:37
associations/loader-methods.test.ts:57:37
associations/required.test.ts:16:37
associations/required.test.ts:24:39
base-prevent-writes.test.ts:88:47
bigint-roundtrip.test.ts:20:36
bind-parameter.test.ts:89:39
column-names-sync-virtual-exclusion.test.ts:31:23
connection-handling.test.ts:145:23
date.test.ts:29:39
delegated-type.test.ts:55:39
dirty.test.ts:118:39
enum.trails.test.ts:424:39
establish-connection.test.ts:133:17
establish-connection.test.ts:150:17
establish-connection.test.ts:171:17
establish-connection.test.ts:188:17
establish-connection.test.ts:199:15
establish-connection.test.ts:245:17
locking.test.ts:677:39
locking.test.ts:70:39
primary-keys.test.ts:32:39
primary-keys.test.ts:574:23
test-helpers/handler-resolved-adapter.test.ts:39:26
test-helpers/naked-fixtures.test.ts:52:38
test-helpers/use-transactional-tests.test.ts:19:25
test-helpers/with-transactional-fixtures.test.ts:20:15
unsafe-raw-sql.test.ts:28:39
view.test.ts:22:15
view.test.ts:47:37
```

Two sites are intentional and must NOT be converted:

- `connection-handling.test.ts:145` — the Rails-named test
  _"#connection raises an error if ActiveRecord.permanent_connection_checkout == :disallowed"_
  asserts the raise. It is the pin on the enforcement branch.
- `establish-connection.test.ts` (6 sites) is the largest single cluster and is
  _about_ connection wiring; several of its sites are likely deliberate. Read
  each against its Rails counterpart before changing it.

## Re-verified 2026-08-09 (origin/main 486d9055f)

The inventory below is the 2026-07-25 measurement and has drifted; re-measure
with the gate instrumentation before working it. Known drift:

- The four `test-helpers/**` self-test files named above
  (`use-transactional-tests.test.ts`, `with-transactional-fixtures.test.ts`,
  `naked-fixtures.test.ts`, `handler-resolved-adapter.test.ts`) **no longer
  exist** — that whole `test-helpers/*.test.ts` set was retired. Those 4 sites
  are out of scope.
- `base-prevent-writes.test.ts` still exists but no longer carries a textual
  `.connection` read.
- Every other listed file still exists and still carries `.connection` reads
  (`primary-keys.test.ts` 37, `locking.test.ts` 13,
  `eager-singularization.test.ts` 12), so the bulk of the work is real.
- The suite-wide flag is set in `packages/activerecord/src/cases/helper.ts`;
  `test-setup-ar.ts` does not exist.

## Acceptance criteria

- The residual sites are converted to `withConnection` / `leaseConnection` (or
  `withPooledOrDirectConnection` where a model-facing path is involved), less
  the intentional ones above.
- Test names are NOT changed — they are how `parity:test` matches to Rails.
- Re-measure with the gate instrumentation; remaining hits are only the
  documented intentional ones.
- **Run PG and MySQL lanes in CI.** The audit's first pass never executed 29
  adapter-lane files; a change green on SQLite can be silently wrong on PG/MySQL
  (RFC constraint 1).

May exceed the LOC ceiling across 24 files — split by directory
(`associations/**` is 10 sites) and register the split as sibling stories rather
than fanning out PRs.
