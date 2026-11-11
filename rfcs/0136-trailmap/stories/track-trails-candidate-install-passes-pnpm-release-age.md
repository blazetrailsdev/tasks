---
title: "track-trails: candidate install is refused by pnpm 12's minimumReleaseAge on vendored tarballs"
status: done
updated: 2026-11-11
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: tasks#338
claim: "2026-11-11T04:41:20Z"
assignee: "track-trails-candidate-install-passes-pnpm-release-age"
blocked-by: null
closed-reason: null
---

## Context

The first unattended run of the hourly tracking cron (2026-11-09T01:17Z,
log `~/.cache/trails-tracker/track-20261109T011702Z.log`, issue tasks#329)
failed at `candidate-smoke` before any test ran. The run goes through the login
shell, whose pnpm is v12.3.4, and `pnpm install` in the scratch candidate
refuses the lockfile:

    @blazetrails/tse-compiler@0.1.0 could not be checked against minimumReleaseAge
    (GET https://registry.npmjs.org/@blazetrails%2Ftse-compiler: Not Found - 404)
    The lockfile contains entries that the active policies reject.

The `@blazetrails/*` packages are vendored `file:` tarballs and are not on the
registry, so the release-age policy can never pass them. Until this is fixed no
run can bump the pin, and schedule-continuous-trails-tracking's "pin moves on
its own" cannot be demonstrated.

## Acceptance criteria

- `scripts/track-trails.sh` installs the candidate under the pnpm the cron's
  login shell provides (or pins the pnpm it uses, as `packageManager` says),
  with vendored `file:` tarballs exempt from `minimumReleaseAge`.
- A cron run gets past install to the CLI smoke.
