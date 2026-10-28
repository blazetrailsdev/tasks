---
title: "Pane registry, instances and reconciliation"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps:
  - mux-backend-interface-and-tmux-backend
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Covers the RFC's **Pane identity and discovery** section. It replaces the bare `%123` and the cwd-on-every-lookup approach with `<instance>/<native>` refs and a persistent `panes` table.

## Acceptance criteria

- [ ] `mux_instances` and `panes` tables in muxd's SQLite file, with the columns in the RFC
- [ ] Reconciliation on start and on each poll (at most once every 5 s) adopts unknown live panes, refreshes cwd/repo/branch where `reportsLiveCwd`, and sets `gone_at` on dead ones
- [ ] A recycled native id becomes a new row, and a test proves it
- [ ] Find goes registry first (pr, then branch), falls back to a git probe only for adopted rows with a cwd, and returns an explicit not-found otherwise
- [ ] An instance with `active=false` still resolves its existing refs but takes no new spawns
