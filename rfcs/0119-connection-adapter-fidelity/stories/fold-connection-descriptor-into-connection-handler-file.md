---
title: "ConnectionDescriptor lives in its own file; Rails nests it in connection_handler.rb"
status: ready
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Noted while converging `ConnectionDescriptor#name` on PR #7070
(`converge-connection-descriptor-name-to-rails-primary-class-form`), which fixed
the name semantics but deliberately left the file layout alone.

Rails has no `connection_descriptor.rb`: `ConnectionDescriptor` is a nested
class inside `ConnectionHandler`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:56-74`).
trails puts it in its own file,
`packages/activerecord/src/connection-adapters/abstract/connection-descriptor.ts`,
which `parity:api` only resolves by short name. `connection-handler.ts` already
re-exports it (`connection-handler.ts:39`), so the layout is the whole
divergence.

## Converged shape

Move `ConnectionDescriptor` (and the `ConnectionOwner` interface it carries)
into
`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts`,
next to `ConnectionHandler` as Rails nests it, and delete
`connection-descriptor.ts`. Update the importers — `pool-config.ts`,
`connection-pool.ts`, `abstract-adapter.ts`, `support/pooled-sqlite-adapter.ts`,
`support/second-connection.ts`, `support/template-global-setup.ts`,
`test-adapter.ts` — to import from `connection-handler.js`.

Watch the module-eval cycle: `connection-descriptor.ts` imports
`isPreventingWrites` from `core.js`, and `connection-handler.ts` sits in a
denser import graph, so verify both directions with a plain-node import of the
BUILT `dist/**.js` entry modules (a vitest run masks TDZ — see CLAUDE.md,
"Call-time constant resolution").

## Acceptance criteria

- [ ] `ConnectionDescriptor` and `ConnectionOwner` live in
      `abstract/connection-handler.ts`; `abstract/connection-descriptor.ts` is
      deleted and no importer references it.
- [ ] `pnpm parity:api` deltas non-negative; no new extra surface.
- [ ] Connection-handling, sharding and prevent-writes suites green on all three
      lanes, with `dist` entry-module imports verified for TDZ.
