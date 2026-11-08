---
title: "solid-cable parity:test reaches 100% (solid_cable_test, update generator)"
status: ready
updated: 2026-11-08
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cable"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On origin/main (45db00824f), `pnpm parity:test --package solid-cable` reports 13/21:

- `test/solid_cable_test.rb` (7) is unported: version, the three `autotrim?` cases, default `trim_batch_size`, `trim_batch_size` when set badly, and when set. `packages/solid-cable/test/support/config-stubs.ts` already exists for `with_cable_config`.
- `lib/generators/solid_cable/update/update_generator_test.rb` (1, "cable_schema exists") is unported, and so is `vendor/solid_cable/v3.0.7/lib/generators/solid_cable/update/update_generator.rb`. Only `install/` exists under `packages/solid-cable/lib/generators/solid-cable/`.

`pnpm parity:api --package solid-cable` is 19/19 methods. Its one advisory arity mismatch is `Message.broadcastable`: ruby `()` (a scope), ts `(channels, lastId)`.

## Acceptance criteria

- `test/solid-cable.test.ts` ports the 7 tests under their Rails names, and they pass.
- `SolidCable::UpdateGenerator` is ported at its Rails path with its template and USAGE, and its test passes.
- `pnpm parity:test --package solid-cable` is 21/21 and `parity:api` stays 100%. The arity mismatch is fixed or recorded as a scope-lambda extractor artifact.
