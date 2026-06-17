---
title: "Kanban example: README, smoke, CI lane, link from AR README"
status: draft
updated: 2026-06-17
rfc: "0034-sveltekit-kanban-example"
cluster: examples
deps: ["sveltekit-kanban-routes-ui"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 4 of the SvelteKit Kanban example. Author the README walkthrough, join the
deferred `ci-examples-job` lane (RFC 0003), and replace the "planned Vite
example" note in `packages/activerecord/README.md` with a link to the new
example.

## Acceptance criteria

- [ ] `examples/sveltekit-kanban/README.md` walks through setup/run/typecheck/
      smoke, mirroring twitter-clone's framing.
- [ ] A no-HTTP `pnpm smoke` drives models/transactions under TRAILS_ENV=test.
- [ ] Example joins the lightweight examples CI lane (build, db:setup,
      typecheck, smoke).
- [ ] `packages/activerecord/README.md` links the example, replacing the
      "planned" note.
