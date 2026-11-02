---
title: "Zeitwerk build artifacts and the trails-tsc subcommand"
status: done
updated: 2026-11-01
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk", "trails-tsc", "trailties"]
deps: ["zeitwerk-setup-walk"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9588
claim: "2026-11-01T20:46:44Z"
assignee: "zeitwerk-build-artifacts"
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 § "The ratified deviation". The shape is `build-views` (root CLAUDE.md § "Templates are precompiled"). The step boots the app as far as `setup_main_autoloader`, walks, and writes `.trails/autoload/<tag>/`.

## Acceptance criteria

- `manifest.json` maps cpath to `{ path, export, kind }` in walk order, with a configuration digest.
- `imports.generated.js` and `constants.generated.d.ts` are written; the latter augments ruby-compat's `ConstantTable`.
- `setup` reads a manifest and raises on a digest mismatch.
- `trails build` runs the subcommand.
- Root CLAUDE.md gains "`Module#autoload` is a build step", and `SCOPED_SKIP_GROUPS` a row citing it.
