---
title: "trailties registers Trails as a top-level constant so et-orbi's rorv resolves"
status: draft
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
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

et-orbi's `EtOrbi.platform_info` reads `Rails::VERSION::STRING rescue nil` (`vendor/et-orbi/v1.2.11/lib/et-orbi/info.rb:18`). Since trails#9303, `packages/et-orbi/src/info.ts` reads `registeredConstant("Trails")` (`Rails` maps to `Trails` in `scripts/parity/conventions.ts`). Nothing calls `registerConstant("Trails", …)`: trailties seats `TopLevel.Trails` only. So `rorv` is always nil, even in a booted app, where Ruby answers the Rails version.

## Acceptance criteria

- [ ] trailties registers its top-level `Trails` module with `registerConstant("Trails", Trails)`, where it seats `TopLevel.Trails`, mirroring `rb_const_set` on Object for `module Rails`.
- [ ] A test with trailties loaded shows `EtOrbi.platformInfo()` carrying `rorv` equal to `Trails.VERSION.STRING`.
