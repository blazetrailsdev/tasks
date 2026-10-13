---
title: "Write the bump runbook into vendor/README.md, CONTRIBUTING.md and CLAUDE.md"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: post-flip
packages: [scripts]
deps: [flip-the-rails-ref-to-v8-1-4, generate-the-rails-8-1-burn-down-stories]
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 7. vendor/README.md § "Upgrading a source (bumping `ref`)" was written
by RFC 0159's `document-the-upstream-upgrade-procedure` (done, trails#8187).
This story amends that section; it does not replace it. The section is
correct step by step, but was written before the first real bump: its step 6 burns the
DRIFT list down with the gate red, and § "What the parity gates do across a
bump" does not say which gates fail. This story is written after the flip so
it records what happened, not what was planned. Docs-only.

## Acceptance criteria

The three deltas against RFC 0159's text are the entry criteria and tag
(new), step 6 and the gates section (rewritten for the ledger), and the dry
run (replaces hand-running the drift report for scoping).

- [ ] vendor/README.md § "Upgrading a source" carries the nine-step runbook of
      RFC § 7 with every command, the entry criteria, the dependent-source
      rule ("moves to what the target Rails `Gemfile.lock` resolves, unless
      the pin is already at or past it"), the `rails-<version>` tag, and the
      difference between a minor and a patch bump.
- [ ] § "Scoping a Rails bump" points at `pnpm parity:bump:dry-run`, and
      § "What the parity gates do across a bump" has the per-gate table and
      the ledger rules. The `## Status` wave table is removed.
- [ ] CONTRIBUTING.md § "Body pins": DRIFT during a bump is a ledger row;
      `--pin` clears it; "never re-pin to silence the gate" is unchanged.
- [ ] CLAUDE.md § "A documented deviation is debt, not permission" names the
      bump ledger among the registers, and "Before you open the PR" says what
      to do on touching a ledgered unit.
- [ ] Anything in the RFC's plan that the real flip contradicted is corrected
      in the RFC's Changelog and in the runbook.
- [ ] `pnpm vitest run scripts/vendor-citations.test.ts` passes.
