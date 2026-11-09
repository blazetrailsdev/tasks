---
title: "src-references scans markdown citations"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#9916
claim: "2026-11-09T13:20:31Z"
assignee: "port-help-and-version-commands-for-split-namespace"
blocked-by: null
closed-reason: null
---

## Context

After trails#9839 moved actioncable and actionmailer, `scripts/layout/src-references.ts <pkg>` printed `none` for both packages. Review then found four stale `src/` citations in markdown that the script never scanned:

- `packages/actioncable/README.md:4,38`
- `packages/actionpack/CLAUDE.md:72` (`actionmailer/src/base.ts`)
- `packages/ruby-compat/README.md:96` (`actioncable/src/connection/base.ts`)

## Acceptance criteria

- [ ] src-references also scans `*.md` files outside `vendor/` and `node_modules/`, and reports `packages/<pkg>/src/` and `<pkg>/src/` citations.
- [ ] A test covers a markdown hit.
