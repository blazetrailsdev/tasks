---
title: "Generated bin/trails forwards no signals: it orphans the server, and ignores SIGTERM as PID 1"
status: draft
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap#63. `bin/trails` as `trails new` writes it
(`packages/trailties/src/generators/app-generator.ts`, the `bin/trails`
template) runs the CLI with `spawnSync` and installs no signal handlers.

- Signalled directly (a supervisor, `kill`), the wrapper dies and the server it
  started is orphaned and keeps the port.
- As PID 1 in a container (`CMD ["./bin/trails", "server"]`, the shape Rails'
  Dockerfile uses with `./bin/rails`) SIGTERM is ignored outright: `docker stop`
  waited out its timeout and killed it (13s, exit 137) where a forwarding
  wrapper stopped in 2s.

trailmap carries a corrected copy of its own `bin/trails` (async `spawn`,
SIGINT/SIGTERM/SIGHUP handed to the child, exit status mirrored, `error`
handled). That file is generator output, so the template owes the same fix.

## Acceptance criteria

- [ ] The generated `bin/trails` hands SIGINT, SIGTERM and SIGHUP to the command it runs and exits with its status
- [ ] A missing `node_modules/.bin/tsx` is a message and a non-zero exit, not an uncaught `ENOENT`
- [ ] A generator test pins the template; trailmap's `bin/trails` is regenerated from it
