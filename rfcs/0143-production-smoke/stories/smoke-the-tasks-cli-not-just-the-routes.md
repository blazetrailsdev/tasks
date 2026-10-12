---
title: "Smoke the tasks CLI, not just the routes"
status: done
updated: 2026-10-12
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["extract-the-deploy-assertions-into-a-smoke-suite"]
deps-rfc: []
est-loc: 220
priority: 3
pr: trailmap#59
claim: "2026-10-12T13:26:10Z"
assignee: "smoke-the-tasks-cli-not-just-the-routes"
blocked-by: null
---

## Context

RFC 0136 phase G turns `tasks` into an HTTP client. What breaks for agents
then is not the endpoint — it is `TRAILMAP_URL`, `PATH`, where the binary was
installed, and container-versus-host resolution. Those are exactly the failures
a `curl` from the smoke script cannot see, because the script is not standing
where an agent stands.

Phase G's verification already demands that every verb prints identical stdout
through the API. This runs that assertion continuously instead of once at
cutover.

## Acceptance criteria

- [ ] Tier 2 invokes the installed `tasks` binary from a real worktree, in the
      environment an agent has, and asserts on stdout
- [ ] At least the read verbs the spawn loop depends on are covered
- [ ] A missing or misresolved binary is reported as its own assertion, not as
      a generic tier failure
- [ ] The check runs from a worktree path of the shape agents actually use

## Verification

Unsetting `TRAILMAP_URL` in the canary's environment turns the assertion red
with a message naming the variable.
