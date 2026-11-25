---
title: "SolidCable::InstallGenerator writes config/cable.yml as Rails does"
status: blocked
updated: 2026-11-25
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: [solid-cable]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-25T14:44:47Z"
assignee: "solid-cable-install-generator-writes-cable-yml"
blocked-by: "operator decision: trails app config is TS modules repo-wide — Application#configFor (packages/trailties/lib/application.ts:518-551) loads only .ts/.js, actioncable's engine reads config/cable.ts (packages/actioncable/lib/engine.ts:72), and the app generator writes config/cable.ts. A cable.yml from the solid_cable generator would be read by nothing unless configFor gains a YAML arm and the engine/app generator switch to cable.yml; that repo-wide config-format choice is the operator's. If TS config is ratified, this story closes PERMANENT and the receipt becomes PERMANENT."
closed-reason: null
---

## Context

`SolidCable::InstallGenerator#copy_files`
(`vendor/solid_cable/v3.0.12/lib/generators/solid_cable/install/install_generator.rb:6-9`)
calls `template "config/cable.yml", force: true`. The port
(`packages/solid-cable/lib/generators/solid-cable/install/install-generator.ts`)
calls `this.template("config/cable.ts", { force: true })` with a
`templates/config/cable.ts.tt` template, so a generated app gets a TypeScript
cable config where Rails writes YAML. The call site carries
`@missingRailsArgs template — CONVERGEABLE` pointing here; it surfaced when
red-65161fd9 added `lib/./generators` to solid_cable's `extraLibPaths`
(`vendor/sources.ts`) so the generators' Ruby class paths reach the manifest.

## Acceptance criteria

- The generator writes `config/cable.yml` from a `cable.yml.tt` template, as
  Rails does, and whatever reads the cable config in a generated app reads it.
- The `@missingRailsArgs` receipt on `copyFiles` is removed and
  `pnpm parity:api:calls:args` stays green.
