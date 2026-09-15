---
title: "Converge arel's node-slots onto ActiveSupport::Autoload (decides the hot-path lookup cost)"
status: ready
updated: 2026-09-15
rfc: "0151-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - arel
deps:
  - "port-activesupport-dependencies-autoload"
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/node-slots.ts` (the largest slot, ~87 lines) seats the `Not` / `Grouping` / `Or` / `And` / `Equality` / `In` / `Attribute` / `Dot` / `Table` ctors and `buildQuoted`, read by `nodes/node.ts`, `nodes/node-expression.ts`, `nodes/binary.ts`, `nodes/casted.ts`, `arel.ts` and `tree-manager.ts` (e.g. `new _Not!(this)` for `Arel::Nodes::Node#not`, `arel/nodes/node.rb:122`). Rails' `arel.rb` resolves these through plain constant lookup under `Arel::Nodes`.

These reads sit on the hottest path in the repo (every predicate builds nodes), so this is where RFC Open question 1 — registry lookup vs. a live binding exported by `autoload` — gets decided. Do it first, before the other packages copy a shape.

## Acceptance criteria

- Each slot module listed is deleted; its constants are registered with `autoload` / `eagerAutoload` on the namespace that Rails spells, and readers resolve them at call time with no guard (CLAUDE.md § "Call-time constant resolution").
- For every cycle a slot broke, a plain-node import of the built `dist/**.js` defining module AND its reader as entry modules does not throw TDZ — vitest does not count.
- `pnpm parity:api:extra:gate` `total` does not rise (removed setters should lower it; tighten with `parity:api:extra:tighten`), and `parity:api:calls` / `:args` stay green.
- A benchmark (committed as a `*.bench.ts` or recorded in the PR body with the command) compares node construction before/after; the PR records the chosen read shape and writes it into the RFC's Open question 1 as resolved.
- `arel` stays at its pinned extra-surface state (novel 0).
