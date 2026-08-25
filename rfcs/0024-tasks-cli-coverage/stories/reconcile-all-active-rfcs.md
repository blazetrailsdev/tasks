---
title: "Generalize reconcile.mjs beyond RFCs 0001-0010"
status: done
updated: 2026-06-15
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 41
claim: "2026-06-15T17:00:30Z"
assignee: "reconcile-all-active-rfcs"
blocked-by: null
---

## Context

`scripts/reconcile.mjs` cross-checks story status against shipped signals
(merged PR in `pr:`, `#NNNN` body refs, title-token overlap, memory-index
mentions) and prints likely-done / likely-open / unknown verdicts — but it's
hardcoded to RFCs 0001–0010 (`EXISTING_RFC_RE`), its original migration
scope. The "ready ≠ undone, verify before claiming" failure mode it was
built for applies to every RFC: stories drift out of sync with reality
whenever a PR merges without the agent flipping status.

Generalize it: default to all stories in non-terminal RFCs (`draft`,
`active`, `postponed`), with `--rfc <slug>` to scope a single RFC. Stays
read-only — it reports, never edits frontmatter.

## Acceptance criteria

- [ ] `node scripts/reconcile.mjs` covers all stories whose RFC status is
      not `closed`/`superseded`; `--rfc <slug>` restricts to one RFC
      (numbered or `0000-` placeholder).
- [ ] `EXISTING_RFC_RE` and the 0001–0010 framing in the header comment are
      removed/rewritten; `--json` output gains the story's RFC slug per row.
- [ ] A summary footer counts likely-done stories whose status is not
      `done` — the actionable drift number — so a periodic run (cron or
      tasks-loop preamble) can alert on a single line.
- [ ] Run it once on current `main` and include the report in the PR
      description; file follow-up status flips for any real drift found
      (via `tasks done`/`refine`, not in this PR).

## Notes

Tasks-repo change only (`scripts/reconcile.mjs`). Title-token matching gets
noisier at full scope — if false positives drown the signal, restrict signal
3 to stories lacking both `pr:` and body refs, and say so in the header.
