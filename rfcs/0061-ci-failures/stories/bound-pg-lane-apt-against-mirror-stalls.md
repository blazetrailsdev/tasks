---
title: "bound-pg-lane-apt-against-mirror-stalls"
status: draft
updated: 2026-10-22
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`apt-get` against the Azure Ubuntu mirror intermittently **stalls** rather
than failing, and burns the job's whole `timeout-minutes` before GitHub
cancels it — which cancels the entire CI run, not just the lane.

Observed on 2026-10-22, the same signature twice within an hour, on `main`
(run 39836272238, 19:16Z) and on PR #9245's branch (run 39841598515, job
120044763951, 19:51Z):

```console
19:51:50 Ign:2  http://azure.archive.ubuntu.com/ubuntu noble InRelease
19:51:53 Ign:10 http://azure.archive.ubuntu.com/ubuntu noble-updates/main amd64 Packages
20:11:23 ##[error]The operation was canceled.
```

Nineteen and a half minutes with no further output, against a
`timeout-minutes: 20`. A re-run cleared it once the mirror recovered.

trails#9245 removed the System Tests lane's exposure by dropping
`--with-deps`, so after it **one** apt call remains in the workflow: the PG
lane's `Install a pg_dump matching the server major`
(`.github/workflows/ci.yml:1507-1521`, job `timeout-minutes: 20`).
`scope-pg-lane-apt-update-to-pgdg-list` (trails#7954) already scoped its
`apt-get update` to `pgdg.list`, so that half cannot be failed by an
unrelated repo — but the `apt-get install -y -qq postgresql-client-17` on
`:1520` still resolves dependencies from the base-image repos, i.e. from
the Azure mirror, with no time limit. A stall there takes down both PG jobs
and the run.

This is the stall-shaped sibling of trails#7954, which fixed the
fail-shaped one.

## Proposal

Bound the step in time and retry it, so a stalled mirror costs a couple of
minutes and a second attempt instead of the job's whole timeout budget:

```yaml
run: |
  ...
  for attempt in 1 2 3; do
    timeout 180 sudo apt-get install -y -qq postgresql-client-17 && break
    echo "apt-get install attempt $attempt timed out or failed; retrying" >&2
    sleep 15
  done
  pg_dump --version
```

`timeout` turns a stall into a fast non-zero exit; the loop absorbs a
transient outage. `pg_dump --version` on the next line is already the
step's own check that the install actually happened, so a loop that
exhausts its attempts still fails the step loudly.

Consider applying the same bound to the `apt-get update` above it, which
has the same stall exposure even though it is scoped.

## Acceptance criteria

- The PG lane's apt steps cannot consume the job's full `timeout-minutes`
  on a stalled mirror; a stall fails or retries within a few minutes.
- `postgresql-client-17` still installs and `pg_dump --version` still
  prints a 17.x version in both `Active Record PostgreSQL Tests (1)`
  and `(2)`.
- A step whose retries are all exhausted still fails red — it does not
  fall through to the tests with no client installed.
- No other CI job's apt usage is changed (there is no other apt call left
  in the workflow).
