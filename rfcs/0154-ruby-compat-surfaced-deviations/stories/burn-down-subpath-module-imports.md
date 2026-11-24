---
title: "burn-down-subpath-module-imports"
status: draft
updated: 2026-11-24
rfc: "0154-ruby-compat-surfaced-deviations"
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

`scripts/parity/module-count.ts:32` counted only `Module` imported from the bare
`@blazetrails/ruby-compat` barrel, so subpath imports (`@blazetrails/ruby-compat/include`)
were invisible. trails#10711 widened the regex and, by operator approval, set the
true marks: actionview `moduleImport` 3→5, activesupport 3→10.

## Acceptance criteria

- [ ] actionview and activesupport `moduleImport` marks converge back to (at least) 3 by converting the `Module` uses to plain-object / class modules (CLAUDE.md § "A Ruby module is a JS object or a JS class")
- [ ] `pnpm parity:modules:tighten` committed
