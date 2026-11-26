---
title: "tests: vi.mock ruby-compat bindings on their owning subpath, not the barrel"
status: ready
updated: 2026-11-26
rfc: "0192-package-entry-point-boot-cost"
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

Vitest's `vi.mock("@blazetrails/ruby-compat", …)` only intercepts imports of the barrel itself. Once the module under test moves to a subpath import, the barrel mock silently stops applying. On trails#10777, `packages/activerecord/lib/connection-adapters/abstract-adapter.ts:38` moved `exec` to `@blazetrails/ruby-compat/process-adapter`. `packages/trailties/test/commands/dbconsole.test.ts:12` was still mocking the barrel, so the test spawned a real database console and Trailties Tests (5) hit its 30-minute timeout.

These 12 test files still mock the barrel: `packages/rack/test/utils.test.ts`, `packages/thor/test/actions/create-file.test.ts`, `packages/thor/test/actions/file-manipulation.test.ts`, `packages/thor/test/shell/basic.test.ts`, `packages/trailties/test/app-loader.test.ts`, `packages/trailties/test/commands/unused-routes.trails.test.ts`, `packages/trailties/test/commands/test.trails.test.ts`, `packages/turbo/test/installer.test.ts`, `packages/vite-assets/test/runner.test.ts`, and the `packages/vite-trails/test/` files `stimulus-install`, `engine-rake-tasks`, `turbo-install` and `css-install`. Each one breaks the same way as soon as the lib file it mocks for moves off the barrel (for example, under `migrate-trailties-off-the-ruby-compat-barrel`).

## Acceptance criteria

- [ ] Each barrel `vi.mock` above mocks the owning module that `scripts/boot-graph/scc-map.json` gives for each mocked binding. The barrel re-exports from that module, so the mock still covers barrel importers.
- [ ] `grep -rn 'vi.mock("@blazetrails/ruby-compat"' packages` returns nothing.
- [ ] Each touched test file passes.
