---
title: "Generated vite.config makes / unreachable: every route 302s to a 404"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 90
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `vite.config.ts` that `trails new` emits makes the generated app
unreachable at `/`. Reproduced on trails `9f8a23690`, Node 24, vite 7.3.1:

```sh
curl -i localhost:3000/
HTTP/1.1 302 Found
Location: /assets/

curl -o /dev/null -w '%{http_code}' localhost:3000/assets/
404
```

Cause is the generated config:

```ts
export default defineConfig({
  root: "app/assets",
  base: "/assets/",
  ...
  rollupOptions: { input: { application: "stylesheets/application.css" } },
});
```

With `base: "/assets/"`, Vite's own middleware redirects `/` to the base path
before the trails plugin ever sees the request, and nothing serves `/assets/`
in dev. The Rack app is never reached, so **every route in a generated app is
dead** as long as the default Vite config is present.

Deleting `vite.config.ts` fixes it completely: `trails server` then takes the
`Handler.Node.run` branch in `commands/server.ts:29`, boots, and serves
correctly — `No route matches [GET] "/"` for an empty route file, and a real
200 once a route exists.

Same run also logs a config error, so the asset build is broken independently
of the redirect:

```text
(!) Failed to run dependency scan. Skipping dependency pre-bundling.
Error: failed to resolve rollupOptions.input value: "stylesheets/application.css".
```

even though `app/assets/stylesheets/application.css` exists.

## Acceptance criteria

- A generated app serves its routes at `/` with the generated Vite config in
  place — Vite handles `/assets/*` and passes everything else through to Rack.
- `rollupOptions.input` resolves; no dependency-scan error on boot.
- A test covers "generated app, unmodified, responds at `/`" — this is the
  default configuration, so it should not be possible to ship it broken.
