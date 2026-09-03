---
title: "RFC 0104 story bodies cite an examples/twitter-app and a server/application.ts that do not exist"
status: done
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: 7437
claim: "2026-09-03T11:20:50Z"
assignee: "resweep-rfc-0104-story-context-against-main"
blocked-by: null
closed-reason: null
---

## Context

RFC 0104's story bodies were written against an `examples/twitter-app`
full-stack app that **does not exist in this repo**. `examples/` holds only
`twitter-clone`, a plain ActiveRecord example — no controllers, no layout, no
`config/application.ts`, no `src/server.ts`:

```console
$ ls examples/
twitter-clone
$ grep -rn "withStaticFiles\|digestPassword\|twitter-app" --include=*.ts .
(no matches outside tasks/)
```

Four stories in the bundle PR #7295 claimed carried an acceptance criterion of
the form "`examples/twitter-app` drops `<workaround>` and its TODO". None had
anything to act on.

Other context in the same stories was stale in ways that changed the work:

- `no-static-or-asset-pipeline` asserted `ActionDispatch::Static` is never
  mounted because `Finisher` does not splice `build_middleware_stack`. Both
  halves were already false on main — `Finisher` declares it and
  `DefaultMiddlewareStack#buildStack` mounts `Static`. Only the third part (the
  shadowing `public/index.html`) was real.
- Both that story and `cli-cannot-load-typescript-app-code` cite
  `packages/trailties/src/server/application.ts` and its `resolveController` /
  `loadRoutes` candidates arrays. That file no longer exists; `server/` holds
  `dev-server.ts` and `vite-plugin.ts`.
- `has-secure-password-unported` asserted `hasSecurePassword` is unimplemented.
  It has been fully ported since 25e3f4ec5 (`activemodel/src/secure-password.ts`,
  bcryptjs-backed, plus `Base.authenticateBy`). Closed as already-done.

The cost is per-story rediscovery: each claiming agent re-derives the true
state before it can size the work, and the acceptance criteria it is measured
against are partly unmeetable.

## Converged shape

Sweep the remaining open RFC 0104 stories against current main and rewrite the
stale halves — story prose is markdown-owned, so this is an edit-and-PR, not a
verb. Drop every `examples/twitter-app` criterion or re-point it at
`examples/twitter-clone` where a real analogue exists; re-derive any story
whose premise names `server/application.ts`.

## Acceptance criteria

- No open RFC 0104 story cites `examples/twitter-app` or
  `trailties/src/server/application.ts`.
- Stories whose premise is already satisfied on main are closed with a reason.
- Remaining stories state their gap against current main.
