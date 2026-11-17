---
title: "Daily GitHub Actions perf benchmark of the twelve-dollar-server, recorded for charting"
status: ready
updated: 2026-11-17
rfc: "0241-request-path-performance"
cluster: "request-perf"
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0241 measures request-path cost by hand on AWS (§ "Slim profile harness"):
a server pinned to one CPU in a cgroup, k6 running `bench/load.js` from
`arjaythedev/twelve-dollar-server-challenge` against its seed, CPU per request
read as the `cpu.stat` `usage_usec` delta over k6's `http_reqs`, and a
`PerformanceObserver` GC log. Every number in the RFC is a one-off. Nothing
records the trend on main, so a regression between re-benches goes unseen and
nothing can be charted over time.

trails side: `examples/twelve-dollar-server/` (`install.sh`, `start.sh`,
`build.sh`). CI today is only `.github/workflows/ci.yml`.

## Design

A new `.github/workflows/perf.yml`, `on: schedule` (daily cron) plus
`workflow_dispatch`, running on `main` HEAD:

1. Check out trails, build it, and check out the challenge repo; run
   `seed/make-seed.sh` (cache the seeded DB keyed on the challenge commit).
2. Install k6 (`grafana/setup-k6-action`).
3. Run the slim harness's plain pass, scaled to a GitHub runner: start the
   server with `systemd-run` (or `taskset` + a cgroup where systemd-run is
   unavailable) pinned to cpu0 with `MemoryMax=2G`, k6 on the other cores;
   30 s warm-up then 2 min at a fixed VU count, from a fresh copy of the seed.
   Load `prof-hooks.mjs` so the GC log is captured in the same run.
4. Emit one JSON record: date, trails SHA, challenge SHA, runner type/CPU
   model, `cpu_us_per_req`, `http_reqs`, req/s, p50/p95/p99, error rate,
   peak RSS (`memory.peak`), GC count, GC % of busy time, max/p50 major GC
   pause.
5. Upload the record and the k6 summary as an artifact, and append the record
   to a durable series (a `perf-data` branch holding `perf/history.jsonl`,
   committed by the workflow with `contents: write`), so it can be charted.

GitHub-hosted runners are noisy and their CPU model varies; the record carries
the CPU model so a chart can split by it, and the VU count is chosen so the
runner is below saturation (CPU per request and GC share stay meaningful even
when absolute latency drifts). A larger or self-hosted runner can be swapped
in later without changing the record shape.

## Acceptance criteria

- `.github/workflows/perf.yml` runs daily on a cron and on
  `workflow_dispatch`, and passes the challenge's `test/test.sh` before
  benching (a failed check fails the run, no record written).
- Each run appends one JSON line with the fields above to
  `perf/history.jsonl` on the `perf-data` branch and uploads raw k6 / GC
  output as an artifact.
- The harness script lives in the repo (e.g. `examples/twelve-dollar-server/bench/`),
  not inline in the YAML, so it can be run locally the same way.
- The PR records the first run's numbers and their run-to-run spread over at
  least three manual dispatches, so later readers know what delta is noise.
- Does not run on PRs and does not touch `ci.yml`.
