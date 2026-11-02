---
title: "autoloader-receipts-recheck-after-scan-retires"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
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

trailties-app-scan-retires replaced root CLAUDE.md § "Trails has no autoloader" with § "The application loader is Zeitwerk". Several receipts still cite the old heading as a reason a test or file cannot port, and that reason no longer holds: `packages/actionpack/src/action-dispatch/dispatch/session/cookie-store.test.ts:295,298`, `packages/actionpack/src/action-controller/controller/live-stream.test.ts`, `packages/activerecord/CLAUDE.md:295-296`, `packages/solid-queue/CLAUDE.md`, `scripts/parity/unported-files/activejob.ts:61`, `scripts/parity/unported-files/unscoped.ts:164,179,188`, `docs/claude-md-decision-history.md`.

## Acceptance criteria

- Each receipt is re-judged against the ported loader: the test or file is ported, or the receipt cites the reason that still applies.
- No citation of the old heading remains, and the note in the root pointer is removed.
