---
title: "CLAUDE.md: a `?` or `_` in a name"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: naming-shape-gate
packages: ["scripts"]
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

Add the RFC's naming rule as a CLAUDE.md section and point it at the gate. It cites `docs/ruby-ts-conventions.md:69-77` (the `_` private-helper candidate) and `:120-128` (reserved-word trailing `_`), and records the 2026-10-26 rulings: generated attribute predicates are `has*`, `then` is ratified, invented names are labelled, and ivar mirrors get `@internal`, then `protected`.

## Acceptance criteria

- [ ] A new CLAUDE.md section states rules 1–5 from the RFC.
- [ ] The section links to `pnpm parity:api:naming-shape` in "Before you open the PR".
