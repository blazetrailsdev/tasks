---
title: "trailmap: adopt the framework's health route, configure-shaped environments and config.x"
status: done
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trailmap#66
claim: "2026-10-12T17:09:56Z"
assignee: "adopt-framework-health-environments-and-config-x"
blocked-by: null
closed-reason: null
---

## Context

Split from `boot-trailmap-through-bin-trails-and-framework-config`, which
trailmap#63 closed with three framework workarounds still in place although
their framework side has landed in the vendored build (`873532aab6`):

- `app/controllers/health-controller.ts` and `get "up", to: "health#show"`.
  `scripts/smoke-prod.sh` and `scripts/smoke-boot.sh` assert its JSON body; the
  framework's `rails/health` answers HTML and only an `@internal` method
  (`renderUp`) changes that from a subclass. Either the smokes move to the
  status code and the framework route is adopted, or trails exposes the hook.
- `config/environments/*.ts` and `config/initializers/filter-parameter-logging.ts`
  are still the inert export shape. Regenerating them activates settings: the
  generated production file sets `forceSsl = true`, which would redirect the
  plain-HTTP loopback API, and reads `process.env` / `process.stdout`.
- `config/fleet.ts` and `config/tasks-content.ts` still read `env` by hand;
  `config.x` and `configFor` now exist.

## Acceptance criteria

- [ ] `/up` is the framework's route, or the reason it cannot be is a trails story
- [ ] The environment files and the filter-parameters initializer are in the `configure` shape, with `forceSsl` decided for the loopback API
- [ ] Fleet and tasks-content settings are read through `config.x` / `configFor`
