---
title: "ringo: act on the relay, audit direct deliveries against it, heal misses"
status: ready
updated: 2026-10-21
rfc: "0200-github-ingestion-in-trailmap"
cluster: null
packages: []
deps: [store-relay-audit-reports]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** btwebooks. No trails packages.

## Context

The RFC's "Ringo audits the relay" is the spec. In btwebooks:

- add `/webhooks/relay` (`main.go`), the same `Handler`, tagged with source
  `relay`
- read the mode from trailmap's `GET /settings/relay_to_ringo` (cached for
  30 s; on error, keep the last known mode, starting from `off`). There's no
  env var for it.
- mode `off`: act on `/webhooks/github` as today, and answer `/webhooks/relay`
  with 200 without acting
- mode `audit`: act on `/webhooks/relay`. For `/webhooks/github`, verify the
  signature, then record `audit_key → seen-at` without acting, in an
  in-memory window. The key is `sha256(body)`, or the semantic fallback if open
  question 1 says bodies differ.
  - a relayed key clears the matching direct entry, and vice versa
  - a direct entry unmatched after **10 minutes** is a **miss**: ringo
    replays it through the handler (heal) and POSTs a miss to trailmap's
    `/webhooks/audit`
  - a healed key stays in the window for 24 h, so a relay that arrives after
    the heal is **not** acted on. It's counted as `late` on the miss instead.
  - every 5 minutes it POSTs a tally per repo × event
- count, in the same in-memory window, any audit key ringo acts on more than
  once (relay plus heal, or a repeated relay), and report it as the tally's
  `duplicates`. That's the measure behind Verification 2, stored in trailmap,
  with no ringo-side log file.

## Acceptance criteria

- [ ] Mode `off` behaves exactly as today (existing tests pass unchanged)
- [ ] Mode `audit`: a relayed event is acted on once, and its direct twin isn't acted on
- [ ] A direct delivery with no relay within the window is healed once and reported as a miss
- [ ] Tallies reach trailmap every 5 minutes, including `duplicates` (should stay 0; a test checks that a relay arriving after its heal is skipped, not counted as a duplicate)
- [ ] A ringo restart in `audit` mode loses at most the in-memory window. That's documented, and the hooks' delivery history covers it.
