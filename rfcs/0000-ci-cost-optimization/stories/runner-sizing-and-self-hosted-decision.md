---
title: "Decide runner-sizing / self-hosted policy (vars.RUNNER break-even)"
status: draft
updated: 2026-06-15
rfc: "0000-ci-cost-optimization"
cluster: runner-sizing
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

**Needs explicit user approval — this story has real-dollar / infra
implications.**

Nine jobs already use `runs-on: ${{ vars.RUNNER || 'ubuntu-latest' }}`, and the
`setup-pnpm` composite has a fully-built self-hosted branch (preinstalled pnpm,
persistent store-dir, no hosted cache). But `vars.RUNNER` is **unset**, so
everything runs on the free hosted runner today. There are three levers, each
with a different cost shape:

1. **Stay hosted (free).** $0 GitHub bill (public repo), but bounded
   concurrency → queue contention at ~370 runs/day, and 2 vCPUs cap AR
   wall-clock.
2. **Larger paid hosted runner** (e.g. 4-core, $0.016/min). Could roughly halve
   AR wall-clock, but **converts $0 into real spend** and costs ~2×/min — only
   justified if queue contention is the proven binding constraint.
3. **Self-hosted** (the scaffolded path). Marginal cost ≈ electricity, but
   real WAN/maintenance exposure — the composite's header documents a prior
   **~1 TB WAN-egress incident** from a mis-cached pnpm store.

This story is the **analysis + decision**, not a blind switch. Cost-weighted,
the default recommendation is: **stay hosted**, do not adopt paid larger runners
purely for cost, and only move the heavy AR jobs to self-hosted if a measured
queue-wait problem justifies it and the WAN-cache footgun is closed.

## Acceptance criteria

- [ ] Measure **queue wait time** (run `created_at` → first job `started_at`)
      over a representative window to establish whether concurrency contention
      is actually binding. Record findings.
- [ ] Produce a break-even table: hosted-free vs 4-core paid (at $0.016/min, on
      the measured AR wall-clocks) vs self-hosted (amortized), for cost **and**
      time-to-green.
- [ ] Recommend a policy and, if approved, wire it (set `vars.RUNNER`, or move a
      specific job subset) — **gated on user sign-off in the PR/RFC thread**.
- [ ] If self-hosted is chosen for any job, verify every such job routes through
      the `setup-pnpm` composite (depends on
      `route-all-jobs-through-setup-pnpm-composite`) so no job bypasses the
      WAN-safe branch.

## Savings & risk

- **Est. savings:** none guaranteed in billed minutes today; the lever trades
  cost for latency. Self-hosted could move ~24 AR min/run off GitHub entirely
  (onto owned hardware) **if** the contention case holds.
- **Risk:** high (real spend / infra). Mandatory user approval. The WAN-egress
  incident is the headline hazard for the self-hosted path.

## Notes

This is a decision/spike story — its deliverable is measurements + a
recommendation, and (only if approved) a small wiring change. Do not flip
`vars.RUNNER` without sign-off.
