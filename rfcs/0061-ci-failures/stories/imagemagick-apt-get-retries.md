---
title: "ci: retry the imagemagick apt-get installs on transient network errors"
status: draft
updated: 2026-11-08
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 4
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9880 added network retries to the "Install a pg_dump matching the server major" step in `.github/workflows/ci.yml`. That step flaked with `curl: (56)` on runs 42514528806, 42514504756, 42510490743 and 42510406575. Its reviewer found the same exposure in the two imagemagick `apt-get` calls (`.github/workflows/ci.yml:1016` and `:1246` at the merge of #9880). Those calls have no `Acquire::Retries`, so a transient mirror error fails the job before any test runs.

## Acceptance criteria

- Both imagemagick `apt-get update` / `apt-get install` invocations pass `-o Acquire::Retries=5`.
- No change to the `changes` job script, which is at the Actions size limit.
