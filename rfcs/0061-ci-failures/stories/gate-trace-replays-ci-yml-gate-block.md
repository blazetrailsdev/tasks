---
title: "gate-trace.sh is out of sync with ci.yml and replays a stale hand copy of the gate block"
status: draft
updated: 2026-09-30
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/ci/gate-trace.sh` refuses to run on main. Its drift check (`:17-27`) compares the `*_RE` names declared in
`.github/workflows/ci.yml`'s filter step against its hard-coded `names` list, and five names are declared in ci.yml but
missing from that list: `ADDITIVE_CANDIDATE_RE`, `DB_ADAPTER_RE`, `GUIDES_EXCL_RE`, `LINTABLE_RE`, `LINT_ALL_RE`. Found
in trails#8284, which also left `thor_only` (`scripts/ci/thor-only.sh`) out of the trace for that reason.

The script also replays its own copy of the `infra_files` / `set_gate` logic (`:36-60`). So it lacks the
`is_additive_registration` narrowing and the `db_adapter_affected` gate, and it runs `echo | grep -q` where ci.yml uses
herestrings (the EPIPE inversion in #7132).

Nothing runs it in CI (`gate-trace-drift-check-in-preflight` is closed), which is how it rotted.

## Acceptance criteria

- [ ] `scripts/ci/gate-trace.sh <path>` runs on main and reports every gate the filter step sets, including
      `db_adapter_affected` and `thor_only`.
- [ ] It replays the filter step's gate block verbatim (as `scripts/ci-suite-coverage.test.ts` `gateRunner` does)
      rather than a hand copy, or it is deleted in favour of a `gateRunner`-backed CLI.
- [ ] A test runs it over one path, so it cannot drift silently again.
