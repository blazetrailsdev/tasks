---
title: "Routes accept an unregistered controller name and 404 at dispatch instead of failing at boot"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A route naming a controller that does not exist draws without complaint and
fails as a 404 on the first request, even though the whole controller table is
already known at boot.

`Finisher`'s `setup_main_autoloader` eagerly imports every controller and seeds
`controllerConstants` keyed by Rails' controller path — `underscore`d, so
`app/controllers/read-models-controller.ts` registers as `read_models`
(`packages/trailties/src/application/finisher.ts`, `loadControllers` /
`collectControllers`). `Request#controllerClassFor` then does a plain
`controllerConstants.get(controllerParam)` at dispatch time, and a miss is a
routing failure with no boot-time signal.

Hit while drawing `mapper.get("index", "readModels#index")`: the camelCase
spelling is the natural one to write next to a `readModels` class and a
`read-models-controller.ts` file, it draws happily, and it 404s at runtime
with nothing pointing at the route as the cause. The correct string is
`read_models`.

## Expected shape

Rails cannot check this at boot — Zeitwerk resolves constants lazily, so an
unknown controller genuinely is not knowable until dispatch. trails is in the
opposite position: `loadControllers` has _already_ imported and keyed every
controller before any route is recognised, so the information is sitting there
unused.

After `drawRoutes` and the autoloader have both run, walk the route set and
raise for any route whose controller is absent from `controllerConstants`,
naming the route and the near-miss (`readModels` -> did you mean
`read_models`?). This is a place trails can be _better_ than Rails rather than
merely faithful, and the deviation is worth recording either way.

Related: `controller-constant-resolution-throws-instead-of-constantize` covers
the resolution mechanism itself, and sits in the retired
`0023-surfaced-deviations`.
