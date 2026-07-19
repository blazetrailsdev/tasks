---
title: "CLI mysql-happy-path E2E never runs: no CI job sets MYSQL_TEST_URL"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed under 0023 because RFC 0003-activerecord-cli is closed.

`packages/activerecord-cli/src/__e2e__/mysql-happy-path.test.ts` exists and is
gated on `MYSQL_TEST_URL` (`:10`), but **no CI job ever sets that variable for
an `activerecord-cli` run**, so the suite silently skips in every job. Verified
against `.github/workflows/ci.yml`: the four `pnpm vitest run
packages/activerecord-cli` invocations are at `:766`, `:850`, `:1003` (the only
one with env, and it sets `PG_TEST_URL` only) and `:1066` / `:1135`.

The mysql/maria jobs carry a stale comment claiming "no mysql-happy-path E2E
exists yet" — it does exist, it just never runs. PR #4961 left that comment in
place (only reflowing the `MYSQL_TEST_URL` wording) because migrating the CLI
E2E was out of that story's scope; the CLI legitimately keeps `PG_TEST_URL`,
since that is its own `--database-url` input rather than a harness backend
selector.

Net effect: MySQL CLI coverage reads as present but is dead.

## Acceptance criteria

- The maria job (and the mysql job when re-enabled) runs the CLI E2E with a
  MySQL connection wired, so `mysql-happy-path.test.ts` actually executes —
  matching how the postgres job already wires `PG_TEST_URL` at `ci.yml:1005`.
- The stale "no mysql-happy-path E2E exists yet" comments are corrected.
- Confirm the suite passes against MariaDB; if it does not, either fix it or
  gate it with a stated reason rather than leaving it silently skipped.
