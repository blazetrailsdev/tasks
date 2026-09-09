---
rfc: "0143-production-smoke"
title: "trailmap proves itself in production, not on a clean runner"
status: draft
created: 2026-09-09
updated: 2026-09-09
owner: "@deanmarano"
packages:
  - trailties
clusters: []
priority: 2
---

# RFC 0143 — trailmap proves itself in production, not on a clean runner

## Summary

trailmap's verification runs almost entirely in CI, against a database CI
rebuilds and a copy of ringo CI vendors. Production is checked once, by hand,
at deploy time. This RFC moves the centre of gravity: a tiered smoke suite runs
continuously on the box against the live application, its results are rows in
trailmap's own database, and CI keeps only the checks that are genuinely
cheaper to run cold.

The reason is RFC 0136's own accepted risk. The cutover has **no offline
fallback** — "If trailmap is down the CLI is down and the fleet stops" — and
the stated mitigation is "a restart policy and a health check, not a second
code path." That mitigation is currently a liveness probe that touches no
dependency, plus a deploy script nobody runs on a schedule.

## Motivation

### The deploy script is already the best test we have, and it runs once

`scripts/deploy.sh` is a real production smoke test and a well-designed one. It
refuses to trust `GIT_REV` (dokku sets it during the _build_, so it reports the
pushed commit whether or not the release replaced anything) and uses the
running container's image id as "the only honest witness". It then checks both
audiences of the one listener separately, because each has failed on its own:

- the loopback API must answer `200` — a `404` means the request arrived
  carrying `X-Forwarded-*` and `requireLoopback` refused it;
- the public vhost must answer `30*` — anything else means **the dashboard is
  being served without SSO**.

Neither assertion is expressible in CI, and neither runs between deploys. Every
property it proves can regress five minutes later with nothing watching.

### `/up` is correct and insufficient

`app/controllers/health-controller.ts` says what it is: it "deliberately
touches no dependency: a third-party outage should not restart the
application." That is the right contract for a probe wired to a restart policy,
and this RFC does not change it.

But the failures that stop the fleet are **process-up** failures:

- migrations did not run, so every page renders and the ready queue silently
  returns the wrong rows;
- the database is locked under WAL contention with ringo, which phase B
  deliberately introduces as a second writer;
- the tasks checkout is unwritable or has no git identity, so `tasks new`
  fails while reads stay green;
- ingest failed, so the queue is empty and the spawn loop ticks on nothing.

A probe that returns `{"status":"ok"}` without opening the database cannot see
any of them, and it is the only thing running between deploys.

### The gates reconstruct a situation that exists for real on the box

The `gate` job in `.github/workflows/ci.yml` checks out the content repo,
migrates a fresh database, ingests the markdown tree, and points both
implementations at that one file — "One snapshot, by construction." The two
ringo gates then run ringo's own code from `vendor/ringo`, a **pinned, vendored
copy**, because "btwhooks has no remote to check out."

That is a lot of machinery to approximate a pair of processes that are already
running side by side, on one box, against one live database. It also decays on
its own: `scripts/ringo-pin.ts` and the story
`warn-when-the-vendored-ringo-pin-goes-stale` exist solely to notice when the
snapshot has drifted from the ringo that is actually serving.

### Phase F's exit criterion is not measurable

RFC 0136 phase F requires "Two weeks serving the public hostname, every phase C
and D gate green _*throughout*_, incidents recorded with the story that fixed
each." The gates are CI gates; CI runs on pull requests. Nothing observes
"throughout", so the sign-off that unblocks all six phase G stories — the
irreversible ones — currently rests on an unverifiable claim.

### A text matcher is standing in for a live assertion

The `nginx-sigil` CI job exists because "the sso plugin re-injects Authelia's
auth directives into the generated nginx config on every reload, using two text
matchers that a comment can trip. Both failures are silent and both end with
the dashboard served unauthenticated."

It string-matches a config file to _infer_ whether auth is on. `deploy.sh`
already tests the actual property with one `curl`. The inference is only
load-bearing because the live check does not run continuously.

## Design

### Three probes, not one

`/up` is unchanged — liveness, no dependencies, feeding dokku's healthcheck and
the restart policy. Two are added:

| Route       | Question                                  | Failure means      |
| ----------- | ----------------------------------------- | ------------------ |
| `/up`       | Did the process boot without exceptions?  | restart it         |
| `/up/ready` | Can it serve correct answers _right now_? | stop routing to it |
| `/up/deep`  | Is the domain itself healthy?             | page a human       |

`/up/ready` opens the database, compares the `schema_migrations` head against
the head the deployed code expects, confirms a non-zero story count, and
confirms the tasks checkout is writable with a git identity configured. The
migration check is the one to build first: it is the only silent fleet-stopper
with no current detector.

`/up/deep` computes a real ready queue and reports its row count and latency.
It is expensive by design and is called by the canary, never by a supervisor.

### Six tiers, one script

`scripts/smoke-prod.sh` is the suite, and `deploy.sh` calls it rather than
inlining its own assertions — the deploy gate becomes "tier 0 and 1 pass",
which is what it already checks, minus the duplication.

| Tier           | Cadence              | Asserts                                                                   |
| -------------- | -------------------- | ------------------------------------------------------------------------- |
| 0 liveness     | 30s                  | `/up` on loopback                                                         |
| 1 readiness    | 1m, and every deploy | `/up/ready`; migration head; public vhost `30*`; loopback `200` not `404` |
| 2 read smoke   | 5m                   | every read verb and page returns 200 with the expected shape              |
| 3 write canary | 15m                  | claim then release a dedicated canary story; assert the row and the event |
| 4 equivalence  | 1h                   | the phase C and D gates against the live ringo                            |
| 5 fleet canary | daily                | spawn one agent on a no-op story; assert pane, PR, teardown               |

Tier 3 is the one nothing covers today. RFC 0136 accepts the write path's lack
of a fallback as its largest risk, and every check that exists is a read.

Tier 5 is the only tier that proves the product rather than the process. Every
other tier can be green while the fleet is dead.

### Tier 2 exercises the CLI, not the routes

Phase G turns `tasks` into an HTTP client. What breaks for agents then is not
the endpoint — it is `TRAILMAP_URL`, `PATH`, where the binary was installed,
and container-versus-host resolution. So tier 2 invokes **the `tasks` binary
from a real worktree** and asserts on its stdout, which is the interface agents
actually use. RFC 0136's phase G verification already demands identical stdout
through the API; this runs that assertion continuously instead of once at
cutover.

### The gates move to the live pair

The three ringo gates run in production, hourly, over the whole database,
against the ringo that is serving. CI keeps a fixture-sized version — enough to
catch an obvious regression on a pull request, fast enough that nobody is
tempted to skip it.

Consequences: the vendored snapshot cannot go stale because there is no
snapshot; phase C's exit criterion is measured over real data volume, including
rows a reconstructed database never contains; and CI gets materially faster.

### Results are rows

Phase B's argument is that fleet state marshalled into JSON files should be
tables. Smoke results are fleet state. Every run writes a row — tier,
assertion, outcome, latency, and the release it ran against — and trailmap
renders the history.

That makes phase F's exit criterion a query rather than a claim, gives every
incident a timestamp and a bounding release, and produces the page a newly
onboarded account is shown after provisioning.

### It runs on the box

The same constraint that forced RFC 0136's validation split applies: the API
binds to loopback, so GitHub Actions cannot reach it. The suite runs on the
box. Ringo's cron surface is the cheap initial home; trailmap's own scheduler
is the destination, and building it is itself proving-ground work — background
jobs are framework surface nothing has made trails exercise.

### What CI keeps

`smoke-boot.sh` stays exactly as it is. Its comment states the reason: "Three
of the six framework bugs the boot probe found only appear from a cold start —
a warm `node_modules` hides them." A cold install from vendored tarballs is
genuinely cheaper and more honest on a clean runner. Typecheck and unit tests
stay for the same reason.

`nginx-sigil` is retired once tier 1 is continuous, and not before.

## Non-goals

- **Replacing CI.** Typecheck, unit tests and the cold-start boot test are
  better on a clean runner and stay there.
- **Changing `/up`.** Its no-dependency contract is deliberate and correct for
  a restart policy; this RFC adds probes beside it.
- **An external monitoring service.** Everything is on one box and results are
  rows trailmap already knows how to render; a hosted checker would be a second
  read model of the thing being checked.
- **Alerting policy.** What pages whom is a follow-on. This RFC produces the
  signal; routing it is separate.
- **Load or performance testing.** Latency is recorded, not asserted against a
  budget.

## Alternatives considered

- **Keep the gates in CI and add prod smoke beside them.** Cheapest, and leaves
  the vendored-ringo pin decaying in place with a story dedicated to noticing.
  The gates are the checks that most want the live pair.
- **Run the suite from GitHub Actions.** Impossible without exposing the
  loopback API, which RFC 0136 declines to do until it must be reachable
  off-box.
- **Fold everything into `/up`.** Makes a database blip restart the process,
  which is the failure the health controller's comment explicitly guards
  against.
- **Uptime Kuma.** Already on the box, and fine for tier 0. It cannot express
  tiers 2 through 5, and its results are not rows trailmap can render beside
  the deploys they bound.

## Rollout

1. **Probes.** `split-the-health-endpoint-into-liveness-and-readiness`,
   `assert-the-migration-head-in-the-readiness-probe`.
2. **The suite.** `extract-the-deploy-assertions-into-a-smoke-suite`,
   `run-the-smoke-suite-on-a-schedule`.
3. **Durable results.** `record-smoke-runs-in-a-table`,
   `render-the-smoke-history-page`.
4. **The uncovered paths.** `add-a-write-canary-for-the-claim-path`,
   `smoke-the-tasks-cli-not-just-the-routes`.
5. **The gates move.** `run-the-equivalence-gates-against-the-live-pair`, then
   `shrink-the-ci-gates-to-fixture-size`.
6. **Retirements and the end-to-end canary.**
   `retire-the-nginx-sigil-text-matcher`,
   `spawn-a-daily-end-to-end-fleet-canary`.

Nothing here deletes a check before its replacement is running. Both retirement
stories name, as their first acceptance criterion, the tier that has to have
been green for a week first — and each depends on the story that makes that
tier run, so the ready queue cannot hand one out early.

## Verification

- **Tier coverage.** Every tier 0–4 assertion has run at least once per its
  cadence for seven consecutive days, evidenced by rows, before phase F's soak
  clock is allowed to start.
- **Phase F becomes a query.** "Two weeks, every gate green throughout" is
  answered by a `SELECT` over the smoke table, not asserted.
- **The gates catch a real difference.** Each relocated gate keeps its
  `--self-test`, run against the live pair, so a gate that has stopped looking
  goes red.
- **CI wall-clock.** The `gate` job's duration falls, and the number of
  vendored-ringo files needed by CI reaches zero.
- **Detection, not just coverage.** Each of the four named process-up failures
  is reproduced deliberately once and must turn a tier red; a failure mode no
  tier detects is a gap in this RFC, not an acceptable one.
- **Framework yield.** Trails stories filed because the suite found something
  CI structurally could not — SIGTERM during a redeploy, connection reuse, WAL
  contention with the second writer, streaming under real load.

## Open questions

1. **Does tier 5 spawn a real agent, and what does it cost?** A daily agent
   that opens and closes a no-op PR is the only end-to-end proof, and it is the
   only tier that spends money and touches GitHub. Recommendation: build it
   last, behind a flag, and price it from the session-cost index before turning
   it on.
2. **Where does the smoke runner live before trailmap has a scheduler?** Ringo
   crons work today and are one more thing to migrate later. Recommendation:
   ringo cron, with the story that moves it filed at the same time.
3. **Does the write canary use a real story or a synthetic one?** A synthetic
   canary story is inert but pollutes the backlog and every count over it.
   Recommendation: synthetic, with a reserved id the read models exclude —
   decide the exclusion mechanism before writing the canary.
4. **What is the migration-head comparison against?** The deployed code has to
   know the head it expects; whether that is generated at build time or read
   from `db/migrate` at boot is a trails question as much as a trailmap one.

## Changelog

- 2026-09-09: initial RFC
