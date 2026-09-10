---
title: "scope-pg-lane-apt-update-to-pgdg-list"
status: ready
updated: 2026-09-10
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The PG lane's `Install a pg_dump matching the server major` step
(`.github/workflows/ci.yml:1274-1284`) adds the PGDG repo and then runs a
repo-wide `sudo apt-get update -qq` (`:1282`) before installing
`postgresql-client-17`.

`apt-get update` exits non-zero when **any** configured repository's index
fails to download — not just the one being added. The GitHub `ubuntu-24.04`
runner image ships with Google's Chrome apt repo preconfigured, and the step
runs under the workflow default `bash -e`, so an outage in that unrelated
third-party repo kills both PG jobs before a single test executes.

This happened on 2026-09-09 and took down `main` as well as every open PR
touching AR. Observed on run 34383003367 (PR #7645) and run 34382832639
(`main` at `f6289fd73e`), three attempts ~30 minutes apart, all identical:

```console
$ sudo apt-get update -qq
E: Failed to fetch https://dl.google.com/linux/chrome-stable/deb/dists/stable/main/binary-amd64/Packages.gz  Hash Sum mismatch
   Hashes of expected file:
    - SHA256:233e56de019b57db89238fa7bcc3647718dbbea3a40c2dc1c633a8c8952aa9e9
   Hashes of received file:
    - SHA256:bc1428ab27c6d76ee9bb76de07f1ded0ddb4aaabd958fc72855634ef5894a4b3
E: Some index files failed to download. They have been ignored, or old ones used instead.
##[error]Process completed with exit code 100.
```

Google's mirror was serving a `Packages.gz` inconsistent with its own
`Release` file. Nothing in this repository depends on that repo; the PGDG
index the step actually needs downloaded fine. The lane is hostage to an
unrelated vendor's mirror health, and a re-run does not clear it while the
outage lasts.

The step was introduced by the (closed) RFC 0064 story
`provision-version-matched-pg-client-in-pg-lane` / PR #6296, which enrolled
`PostgreSQLStructureDumpTest#structure_dump`. That story is not being
reopened — the provisioning is correct, only its blast radius is wrong.

## Proposal

Scope the index refresh to the PGDG list the step just wrote, so no other
repository on the image can fail it:

```yaml
sudo apt-get update \
-o Dir::Etc::sourcelist=/etc/apt/sources.list.d/pgdg.list \
-o Dir::Etc::sourceparts=- \
-o APT::Get::List-Cleanup=0 \
-qq
```

`sourceparts=-` suppresses the `.d` directory and `List-Cleanup=0` keeps the
scoped run from discarding the indexes of the repos it did not fetch, which is
what lets the subsequent `apt-get install` still resolve base-image packages.

Verify by asserting the install still succeeds and `pg_dump --version` reports
17.x in both PG jobs.

## Acceptance criteria

- `.github/workflows/ci.yml`'s `Install a pg_dump matching the server major`
  step refreshes only `/etc/apt/sources.list.d/pgdg.list`.
- `postgresql-client-17` still installs and `pg_dump --version` still prints a
  17.x version in both `Active Record PostgreSQL Tests (1)` and `(2)`.
- A broken or unreachable third-party repo on the runner image (Chrome, or any
  other preinstalled source) no longer fails the step.
- No other CI job's apt usage is changed.
