---
title: "Delete the bespoke devcontainer generator test duplicate; keep its TS-only tests in .trails.test.ts"
status: in-progress
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10528
claim: "2026-11-21T21:57:40Z"
assignee: "app-generator-css-tailwind-writes-tailwindcss-vite"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/generators/trails/devcontainer/devcontainer-generator.test.ts`
is an older, bespoke copy of `vendor/rails/v8.0.2/railties/test/generators/devcontainer_generator_test.rb`,
with `test_…` names, `fs`/`path` setup and inline fixtures. trails#10482 ported
the Rails file at its convention path, `test/generators/devcontainer-generator.test.ts`.
The old file also carries two TS-only tests, `test_dockerfile_content` and
`test_sqlite_driver_node_sqlite`.

## Acceptance criteria

- [ ] The duplicate file is deleted.
- [ ] Its two TS-only tests move to `test/generators/devcontainer-generator.trails.test.ts`, on the `Generators::TestCase` harness.
