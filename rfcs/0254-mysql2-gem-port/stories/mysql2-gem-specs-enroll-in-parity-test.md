---
title: "Enroll the mysql2 gem's specs in parity:test for the surface the package ships"
status: done
updated: 2026-11-21
rfc: "0254-mysql2-gem-port"
cluster: scoring
packages: ["mysql2", "scripts"]
deps:
  ["mysql2-client-is-a-class-with-async-new", "mysql2-adapter-calls-the-gem-not-the-npm-connection"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#10518
claim: "2026-11-21T19:21:59Z"
assignee: "mysql2-client-initialize-option-writers-reach-the-connection"
blocked-by: null
closed-reason: null
---

## Context

`vendor/mysql2/0.5.6/spec/mysql2/` holds `client_spec.rb`, `error_spec.rb`, `result_spec.rb` and
`statement_spec.rb`. `mysql2-package-and-vendor-source` sets `testPath: "spec/mysql2"`, so
`parity:test` will list them; today the package's only tests are the two trails-only files that
`mysql2-client-result-statement-move-to-the-package` moves
(`client.trails.test.ts`, `client-cast.trails.test.ts`).

The model is RFC 0186's `pg-gem-specs-enroll-in-parity-test`: port the examples that exercise the
surface the package ships (RFC § "The measured split"), and park the rest. Examples that need
`Mysql2::EM`, `Field`, `async_result`, multi-result sets, `session_track` or SSL are outside the
surface (RFC § Non-goals). An example that depends on `fork` or a thread interrupt
(`Thread.handle_interrupt` in `lib/mysql2/statement.rb:4`) is permanently unportable per CLAUDE.md
§ "Runtime facts Node does not expose".

## Acceptance criteria

- [ ] `packages/mysql2/test/` mirrors `spec/mysql2/` file for file for the four specs, with example names unchanged (RSpec `describe` / `it` strings).
- [ ] Every example exercising a method in the RFC's surface table is ported and green on the MariaDB lane; each other example is `it.skip` with a one-line `PERMANENT-SKIP:` (outside the surface, or a Runtime-facts citation).
- [ ] Any RSpec matcher the specs use that is not in `scripts/test-compare/assertion-kinds.ts` is added there; the `assertion-mismatch-mark.json` row is added by hand, never reseeded.
- [ ] `pnpm parity:test` delta for `mysql2` is non-negative and printed in the PR body.

## Verification

```bash
pnpm vitest run packages/mysql2 && pnpm parity:test
```
