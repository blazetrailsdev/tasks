---
title: "PR body attribution guard fails on prose describing the patterns"
status: closed
updated: 2026-07-22
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
closed-reason: "Mis-filed: guard-usability fix for a 3s PR-only job; zero billed-minute or time-to-green impact, and the triggering scenario (PR prose quoting attribution patterns) is rare. Re-file outside 0028 if wanted."
---

## Context

The PR body guard (`.github/workflows/ci.yml`, "Forbid Claude attribution in
PR body") greps the **live** PR body for `ATTRIBUTION_RE`. It cannot
distinguish a real attribution trailer from prose _about_ those patterns.

This is not hypothetical: PR #4995 — the PR that fixed the guard's 5xx
fail-closed behavior — was failed by this guard because its description
quoted the literal test strings to document which regression cases the new
retry helper exercises. The fix was to reword the description to avoid
spelling the patterns out, which means the repo currently cannot document
its own attribution rules inside a PR description.

Same hazard applies to any PR that touches `ATTRIBUTION_RE`, the guard steps,
or CLAUDE.md's attribution section.

## Acceptance criteria

- [ ] A PR description can discuss/quote attribution patterns without failing
      the guard — e.g. ignore fenced code blocks and inline code spans before
      grepping, or honor an explicit opt-out marker
- [ ] A real attribution trailer in ordinary body prose still fails, with the
      existing message
- [ ] The commit-message guard's behavior is unchanged (commit messages have
      no code-fence convention; do not weaken that path)
