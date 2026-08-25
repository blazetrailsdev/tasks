---
title: "Triage six unbaselined lease_connection wide-call mismatches"
status: closed
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "premise was wrong: the six mismatches were caused by PR #5520's leaseConnection-named helper (isPortedWithArgs is global), fixed by renaming it; the one genuine gap is re-filed as query-assertions-missing-materialize-transactions"
---

## Context

A full `pnpm build` followed by `pnpm parity:api --wide-calls` reports six wide
call mismatches that no baseline file covers — `lease_connection` appears zero
times under `scripts/api-compare/call-mismatches-wide-exclude/`, and
`activerecord-test-support/adapter-helper.json` does not exist at all:

- `activerecord connection-handling.ts` — `connection` omits `lease_connection`
- `activerecord tasks/database-tasks.ts` — `migration_connection` omits `lease_connection`
- `activerecord testing/query-assertions.ts` — `assert_queries_count` omits `lease_connection`
- `activerecord testing/query-assertions.ts` — `assert_queries_match` omits `lease_connection`
- `activerecord-test-support adapter-helper.ts` — `current_adapter?` omits `lease_connection`
- `activerecord-test-support load-schema-helper.ts` — `load_schema` omits `lease_connection`

At least one is a genuine gap: Rails'
`vendor/rails/activerecord/lib/active_record/testing/query_assertions.rb:19`
opens with `ActiveRecord::Base.lease_connection.materialize_transactions`, and
`packages/activerecord/src/testing/query-assertions.ts` contains no
`leaseConnection` call at all.

Surfaced while running the gate for PR #5520, whose diff touches none of these
files; a partial build had not scored them. Suspected interaction with the
known TS-extractor cache under-reporting (see
`project_api_compare_ts_cache_under_reports_calls`).

## Acceptance criteria

- Each of the six is triaged: implement the missing `lease_connection` call
  where Rails' behaviour depends on it (start with `assert_queries_count` /
  `assert_queries_match` materializing transactions), or baseline it with a
  per-entry reason if a different path already satisfies it.
- `pnpm parity:api:calls` is green from a clean full build.
- The stale-vs-fresh build discrepancy is understood well enough to say
  whether the gate needs a build-freshness guard like `parity:api:extra` has.
