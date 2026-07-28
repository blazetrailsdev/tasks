---
title: "Run gate-trace.sh drift + carve-out check in preflight"
status: closed
updated: 2026-07-28
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise still live (scripts/ci/gate-trace.sh exists on main and no ci.yml step invokes it — grep 'gate-trace' over origin/main:.github/workflows/ci.yml returns nothing), but it is a zero-savings guard: it protects this RFC's delivered gating machinery rather than cutting minutes, so it has nothing to measure against the wall-time gate. Closed as part of the close-out. FLAG: this is the most defensible of the closes — if gate drift is a real worry, refile it under the CI-correctness RFC rather than reopening here."
---

## Context

PR #5263 added `INFRA_CARVEOUT_RE` (`.github/workflows/ci.yml:121`), which
strips single-consumer `scripts/` subtrees from the infra sweep, plus
`scripts/ci/gate-trace.sh` to replay the gate logic against a path list.

`gate-trace.sh` reads the 13 `*_RE=` assignments straight out of `ci.yml` and
fails if the set drifts from the names it replays (in either direction). But
nothing runs it in CI — it is a manual tool. If someone adds a new
`*_PKGS_RE` gate, or carves a subtree into `INFRA_CARVEOUT_RE` without adding
it to its consuming job's regex, the mistake ships silently: the affected job
just stops running on changes it owns, which looks like a green CI.

The `preflight` job (ci.yml:439) is always-on, unconditional, and already
bundles sub-second shell checks for exactly this reason.

## Acceptance criteria

- [ ] `preflight` gains a step that runs `scripts/ci/gate-trace.sh`'s
      self-check (a `--check`/no-args mode is fine) so gate-name drift between
      the script and `ci.yml` fails CI.
- [ ] Optionally assert a few fixed carve-out expectations (e.g. a
      `scripts/rails-find/`-only path list flips no gate; a
      `scripts/guides-typecheck/`-only list flips exactly `guides_affected`
      and `unit_tests_affected`) so a carve-out without its paired regex
      addition is caught, not just a renamed variable.
- [ ] Step is guarded so it costs no extra billed minute (folded into the
      existing preflight step sequence, per that job's stated rationale).
