---
title: "launch-roadmap-drop-frontiers"
status: draft
updated: 2026-11-18
rfc: "0247-website-refresh"
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

trails#10325 deleted Frontiers (`packages/website/src/lib/frontiers/**`, `docs/frontiers/**`). `docs/launch-roadmap.md` still treats it as a launch blocker: `:27`, `:42`, `:46`, `:65`, `:80-82`, and the whole "Frontiers Split Plan" (`:85-137`). `docs/index.md:26` lists the roadmap as the P0 launch doc.

## Acceptance criteria

- [ ] `docs/launch-roadmap.md` has no Frontiers reference; the launch checklist is rewritten against RFC 0247's website plan, or the doc is retired and its `docs/index.md:26` row removed.
- [ ] `git grep -i frontiers -- docs` prints nothing.
