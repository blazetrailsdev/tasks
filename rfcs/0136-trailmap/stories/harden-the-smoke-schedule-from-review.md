---
title: "Fix the smoke schedule defects the trailmap#59 review found"
status: ready
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#59 merged before its review was addressed. The review found three
defects that let the smoke schedule report the wrong thing, and four smaller
ones. Part of the fix is parked, unfinished, on trailmap branch
`smoke-review-fixes` (commit `5905bf9`, `scripts/smoke-cron.sh` only).

In `scripts/smoke-prod.sh`:

- **`tier2.cli-ready-matches-api` passes when both sides are broken.** The loop
  in `tier2Cli` compares `jq -c '[.[].id]'` of the CLI stdout and of the API
  body, each with `2>/dev/null`. A failed `tasks ready --json` and an API body
  that is not an array both print nothing, and two empty strings compare equal.
  Neither the CLI exit status nor `$status` is checked.
- **A hung verb hides the rest of the tier.** Every `cli` call and every `fetch`
  gets the full `$TIMEOUT`. Under cron that was half the tier's budget, so two
  hung calls use the whole budget and the run is killed with no assertion
  named. The suite needs a deadline: each call gets what is left, and a call
  with no time left fails by name.
- **`cli` falls back to raw input for every filter.** The second `jq -Rs` runs
  for any filter that failed on JSON, not only `where`, and its comment says
  `-s`. Restrict the raw read to the verb whose stdout is not JSON.

In `scripts/smoke-cron.sh`:

- **A tier that ignores TERM is not logged as killed.** `timeout -k 5` exits 137
  after the KILL, and only 124 writes the `killed` line. Bash also announces the
  killed child on the wrapper's stderr, which cron mails; a subshell with
  stderr discarded did not suppress it on the branch.
- **An unwritable `LOG_DIR` is logged as an overlap.** `exec 9>` is unchecked,
  so `flock -n 9` fails and the run says `skipped`.
- **A skipped run's block can be lost.** The skip path appends without a lock
  while the lock holder may be cutting the log, and the cut rewrites the log in
  place where a reader can see it half written.
- **The overlap self-test waits `sleep 1`** for the first run to take the lock,
  which a loaded runner can miss. `crontab()` shadows the binary's name and
  the printed entries do not quote the script path.

The branch has the last four done except the stderr announcement, and passes
`TRAILMAP_SMOKE_DEADLINE` to the suite, which does not read it yet.

## Acceptance criteria

- [ ] `tier2.cli-ready-matches-api` fails when the CLI exits non-zero, when
      `/stories/ready` is not 200, and when either side is not an array of ids,
      each held by a `--self-test` case
- [ ] `smoke-prod.sh` honours a deadline: with a `tasks` that hangs, every
      `tier2.cli-*` row is still printed and the suite exits before the kill
- [ ] The raw-stdout read applies to `where` only
- [ ] Exit 124 and 137 both write the `killed` line, and the wrapper prints
      nothing on its own stdout or stderr in either case
- [ ] An unwritable log directory exits non-zero with its own message
- [ ] Appends and the size cut are serialised, and the cut is moved into place
- [ ] The overlap self-test waits on a marker, not a sleep
- [ ] Ringo's parser (`webhook/smokecron.go` in btwhooks) still reads the log

## Verification

`./scripts/smoke-prod.sh --self-test` and `./scripts/smoke-cron.sh --self-test`
pass in CI, and tier 2 run on the box with a `tasks` shim that sleeps reports
nine named `tier2.cli-*` failures and no `killed` line.
