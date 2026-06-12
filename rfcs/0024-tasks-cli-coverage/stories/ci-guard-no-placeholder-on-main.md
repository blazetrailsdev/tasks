---
title: "Guardrail — belt-and-suspenders catch for placeholder RFCs persisting on main"
status: draft
updated: 2026-06-12
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`main` is supposed to hold only numbered RFCs; `0000-*` (and legacy `draft-*`)
placeholders live on PR branches until finalize assigns a number.

**This is now handled automatically.** The `auto-finalize-rfc` workflow
(`.github/workflows/auto-finalize-rfc.yml`, landed in #24) finalizes any
placeholder the moment it lands on `main` and pushes the renamed result, so
placeholders no longer persist — the original "skipping finalize silently
corrupts main" failure mode (which required repair PRs #18/#22/#23) is closed.

This story is therefore reframed from _primary mechanism_ to _safety net_: catch
the case where auto-finalize is disabled, fails, or is somehow bypassed and a
placeholder actually **persists** on `main`. It must not fight the action — since
auto-finalize self-heals within seconds of the merge push, a hard failure on that
same push would be a false alarm.

## Acceptance criteria

- [ ] A check fails when a `rfcs/0000-*` (excluding `0000-template`) or
      `rfcs/draft-*` directory has **persisted** on `main` — i.e. not on the
      transient merge push that auto-finalize is about to fix. Implement as a
      scheduled job (e.g. daily) or a step that only trips when the auto-finalize
      workflow is absent/disabled, so it never races the self-healing push.
- [ ] Does **not** fire on PR branches (placeholders are legitimate there).
- [ ] Failure message names the offending dir, states that auto-finalize should
      have handled it, and points at `scripts/finalize-rfc.mjs` (→ `tasks finalize`
      once [[cli-finalize-rfc]] lands) for manual recovery.

## Notes

Demoted in importance now that [[cli-finalize-rfc]]'s intent ships as the
auto-finalize action. Keep it as a low-cost backstop; do not implement it as a
blocking step on the merge push itself (that would false-alarm against the action).
