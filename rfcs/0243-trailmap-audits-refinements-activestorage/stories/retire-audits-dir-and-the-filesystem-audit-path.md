---
title: "trailmap: delete AUDITS_DIR, the audits mount and the filesystem audit path"
status: draft
updated: 2026-11-17
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: retire
packages: []
deps:
  [
    import-existing-audits-and-refine-reports,
    audit-report-skill-posts-to-trailmap,
    btwhooks-reads-refinements-and-audits-from-trailmap,
  ]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap, plus the dokku commands in the PR body.

## Context

After the import and the writer switch, nothing reads the directory. What
remains: `config/application.ts:31` (`config.x.audits.dir = env.AUDITS_DIR`),
`auditsDir()` and any leftover `getFs`/`getPath` use in
`app/models/audit.ts`, the `docs/deploy.md` mount instructions, and the dokku
mount set by 0136 `mount-the-audits-directory-on-the-deployed-app`
(`dokku storage:mount trailmap …/audits:/audits:ro`,
`AUDITS_DIR=/audits`).

## Acceptance criteria

- [ ] `grep -rn "AUDITS_DIR\|auditsDir\|config.x.audits\|getFs" app config docs`
      returns nothing audit-related. Tests that set up a temp audits dir are
      deleted or rewritten onto fixtures.
- [ ] The `rails/` twin loses the same config.
- [ ] `dokku storage:unmount` and `dokku config:unset trailmap AUDITS_DIR` are
      run and recorded in the PR. `/audits` on production still lists every
      imported report. A screenshot is in the PR.
