---
title: "Repoint trails README/CLAUDE AR-doc links"
status: done
updated: 2026-06-13
rfc: "0011-activerecord-docs-cutover"
cluster: decommission
deps: ["decommission-docs"]
deps-rfc: []
est-loc: 60
priority: 25
pr: 3169
claim: "2026-06-13T15:03:15Z"
assignee: "repoint-references"
blocked-by: null
---

## Context

After the AR docs are deleted, fix the prose links that pointed at them. No
automated consumer reads `docs/` (decided), so this is link-fixing only — no
code changes. Lands in the **trails** repo. See RFC 0011 §Phase 3.

## Acceptance criteria

- [ ] `README.md` links to deleted AR plan docs repointed at the tasks index /
      `pnpm tasks` (or removed).
- [ ] `CLAUDE.md` "Measuring progress" + any AR-doc references repointed.
- [ ] Grep confirms no remaining links to deleted `docs/activerecord/*` files
      anywhere in trails (excluding `parity-verification.md`).
- [ ] No code/skill/loop change needed — confirm none reference `docs/` paths.

## Notes

Confirm the no-automated-reader assumption with a grep before closing.
