---
title: "btwhooks: stop persisting refine reports, read refinements and audits from trailmap"
status: done
updated: 2026-11-21
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: writers
packages: []
deps: [rfc-refine-done-posts-the-report-to-trailmap, audit-report-skill-posts-to-trailmap]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-11-21T14:22:37Z"
assignee: "btwhooks-reads-refinements-and-audits-from-trailmap"
blocked-by: null
closed-reason: null
---

**Lands in:** btwebooks (`/home/dean/github/deanmarano/btwebooks`, the Go
service trailmap calls "ringo"). No trails packages.

## Context

- `RecordRefine` (`webhook/spawnloop.go:2465-2485`) writes `refines.json`
  (`saveRefinesLocked`, `:2420`) and `refine-history.json`
  (`saveRefineHistoryLocked`, `:2446`). `loadRefines` / `loadRefineHistory`
  (`:2404`, `:2430`) read them at boot.
- Readers: the RFC page's marks (`webhook/rfcs.go:167`, `mergeRefineHistory`
  at `webhook/rfcmarks.go:371`), `listRefines` (`webhook/audits.go:116`),
  `HandleRefineFile` (`:235`), and `listAudits` over `sl.auditsDir`
  (`webhook/audits.go:82-83`).
- ringo already reads trailmap over HTTP (`rfcStoryCount`,
  `spawnloop.go:2495`).

## Acceptance criteria

- [ ] `RecordRefine` no longer writes either file (the pane-reap path is
      unchanged). The two load functions and paths are deleted.
- [ ] `mergeRefineHistory`'s input comes from trailmap's refinements for the
      RFC (a loopback JSON read). `listRefines` / `HandleRefineFile` and
      `listAudits` read trailmap or redirect to trailmap's pages. Pick one and
      say which in the PR.
- [ ] Existing Go tests are updated, and a test stubs the trailmap read.
- [ ] Do not delete `refines.json` / `refine-history.json` on disk:
      `import-existing-audits-and-refine-reports` reads them.
