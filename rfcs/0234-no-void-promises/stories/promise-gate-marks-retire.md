---
title: "The three promise-gate marks read 0 and are deleted, leaving plain errors"
status: draft
updated: 2026-11-12
rfc: "0234-no-void-promises"
cluster: gate
packages: []
deps:
  [
    async-initialize-becomes-static-new,
    constructor-promises-become-threads,
    mutex-synchronize-callers-await,
    zeitwerk-mutex-callers-stay-synchronous,
    activerecord-adapter-void-calls-are-awaited,
    activerecord-relation-and-association-void-calls-are-awaited,
    activemodel-void-async-calls-are-awaited,
    activesupport-callbacks-stop-pre-observing-promises,
    actionpack-void-calls-are-awaited,
    generators-await-source-root,
    fire-and-forget-sites-run-on-a-thread,
    remaining-source-void-promises,
    reset-column-information-is-awaited,
    activerecord-tests-drop-no-promises,
    activemodel-and-remaining-tests-drop-no-promises,
  ]
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

RFC § Verification. Once every convergence story has landed, the `floating`,
`swallowed` and `constructor` marks should read 0 for every package. This story
owns the final tighten and removes the ratchet machinery, so the three rules
stand as plain `error`s. It changes repo tooling only.

## Acceptance criteria

- [ ] A full lint run reports 0 findings for all three rules in every package; any straggler is converged here or filed as a story under this RFC before closing.
- [ ] The three mark files and their tighten scripts are deleted; `eslint.config.mjs` sets the rules to `error` with no mark lookup.
- [ ] `docs/parity-gates.md` drops the ratchet entries and points at the trails `CLAUDE.md` section from `claude-md-ratifies-no-void-promises`.
