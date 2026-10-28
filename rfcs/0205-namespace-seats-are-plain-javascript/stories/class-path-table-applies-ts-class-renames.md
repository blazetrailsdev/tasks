---
title: "Class-path table applies TS_CLASS_RENAMES segments (Railtie/Railties/Rails)"
status: done
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9404
claim: "2026-10-28T14:49:24Z"
assignee: "retire-array-helper-rows-after-native-sweep"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/class-paths.ts` (`renameTokens`) applies only `TOKEN_RENAMES` to a Ruby fqn. It does not apply `TS_CLASS_RENAMES` (`scripts/parity/conventions.ts`: `Railtie`→`Trailtie`, `Railties`→`Trailties`, `Rails`→`Trails`). As a result:

- The generated tables write class paths in Rails spelling: `"Rails::Railtie"` and `"Rails::Engine::Railties"` in `packages/trailties/src/class-paths.generated.ts`, and `"ActiveRecord::Railties::JobRuntime"` in activerecord.
- The seat-written path `AbstractController::Trailties` (actionpack `abstract-controller/trailties/routes-helpers.ts`) disagrees with the generated `AbstractController::Railties`.

trails#9372 worked around this by skipping every _module_ whose fqn has a `TS_CLASS_RENAMES` segment. That leaves those modules named only by their seats.

## Acceptance criteria

- [ ] `renameTokens` (or a sibling step) applies the `TS_CLASS_RENAMES` segment renames to every fqn segment, the same rule `parity:api` matches on.
- [ ] The module skip for `TS_CLASS_RENAMES` segments is removed from `collectClassPaths`.
- [ ] `pnpm parity:class-paths:check` is green. In particular, no seated/generated mismatch remains for `AbstractController::Trailties` (and its `RoutesHelpers`).
- [ ] The regenerated tables answer `rbModName` with the trails spelling for the trailties and activerecord `Railtie`/`Railties` classes.
