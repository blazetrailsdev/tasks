---
title: "normalizeAdapterName's family map is a second enumeration of the driver registry"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`normalizeAdapterName`
(`packages/activerecord/src/connection-adapters/adapter-args.ts`) maps a
registered adapter name onto the argument _family_ `buildAdapterArg` builds
positional Node-driver arguments for:

```ts
case "sqlite3":
case "node-sqlite":
case "expo-sqlite":
case "libsql":
case "libsql-remote":
case "libsql-replica":
  return "sqlite";
```

Those six names are declared, one `register()` call each, in
`packages/activerecord/src/connection-adapters.ts` — so the family map is a
**second enumeration of the driver registry**, kept in a different file and
able to drift from it silently. Rails has no counterpart: one gem per adapter,
keyword-configured, so there is no positional-argument family to select.

PR #7539 converged the surrounding story
(`converge-adapter-args-url-parsing-onto-connection-url-resolver`) and deleted
the three `postgres` / `mysql` / `sqlite` arms as provably dead — an
unregistered spelling raises `AdapterNotFound` in `validateAdapterName`
(`connection-adapters.ts`) long before `buildAdapterArg` runs. It did **not**
do the other half of that story's criterion — "the driver-alias table either
moves to where trails registers its SQLite drivers or is shown to be dead" —
because moving it requires exporting it from `connection-adapters.ts`, which
`parity:api:extra:gate` counts as new public surface.

That story's `@noRailsEquivalent CONVERGEABLE` receipt went away with the
export, so **this duplication is currently untracked debt**. This story is that
tracking.

## Converged shape

Fold the family selection into the driver registry so there is one list, not
two — e.g. carry it on the `register()` entry beside the loader, so adding a
driver cannot forget to classify it. Whatever shape is chosen must not add a
public name: the alternative is keeping the map in `adapter-args.ts` as a
module private and adding a test that fails when a `register()` name has no
family arm.

## Acceptance criteria

- [ ] The set of driver names is enumerated in exactly one place.
- [ ] Registering a new adapter without classifying it fails loudly (test or
      type error), rather than falling through `normalizeAdapterName`'s
      `default` to the generic object arg shape.
- [ ] `pnpm parity:api:extra:gate` does not grow.
- [ ] Three AR adapter lanes green.
