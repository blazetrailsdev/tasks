---
title: "Second round of PG/MariaDB adapter-unique flake burndown"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6203
claim: "2026-08-07T21:36:46Z"
assignee: "port-the-jdn-helper-layer-behind-wnumx-and-cwyear"
blocked-by: null
closed-reason: null
---

## Context

`flake-elimination-as-ci-cost` (PR #4298) is done, but the class is still live
and is now the single largest coverage-neutral CI cost.

Measured over 400 `pull_request` runs / 106 branches / 100 merged PRs in a
29.5 h window (2026-07-30T14:22Z - 2026-07-31T19:54Z):

- Failed runs: 30, burning **1,454 job-min (13.2% of all CI burn)**, and each
  failure costs a full retry (~26 AR job-min + ~9 min of the rest).
- Of 124 runs where SQLite, PG and MariaDB all completed, **12 (9.7%) failed on
  PG or MariaDB only** — pg-only 8, maria-only 3, pg+maria-not-sqlite 1.
- Only 1 of those 12 touched adapter-ish paths, so these are environmental /
  shared-DB collisions rather than real adapter regressions.

Worklist (branches whose runs showed an adapter-unique failure):
`tests-materialize-sqlite-files-in-repo-root`, `arunit2-tables-should-leave-the-primary-schema`,
`courses-professors-references-should-carry-indexes`, `fix/raw-nul-byte-in-canonical-table-rebuild`,
`protectedparams-parameters-shadow-its-own-methods`, `extend-detached-jsdoc-lint-to-scripts`,
`fix/guides-typecheck-loadschema-thunk`, `guard-canonical-loader-src-wide-scan`,
`main-broken-load-schema-thunk-vs-adapter-signature`,
`remove-global-reset-and-skip-shield-after-canonical`,
`rails-test-user-grants-broader-than-build-user`.

Several match existing flake memories (pg_query_canceled, shared-DB shape drift,
schema_migrations collisions).

Unlike gating work this has **zero coverage risk** and improves median
time-to-green, so it clears RFC 0028's wall-time merge bar by construction.

## Acceptance criteria

- [ ] Each worklist entry triaged to a root cause or dismissed with evidence.
- [ ] The adapter-unique failure rate over a comparable window drops measurably
      below the 9.7% baseline above.
- [ ] Fixes land as isolated changes, not blanket retries (see
      `remove-pg-mysql-test-retry-after-flake-burndown`).
