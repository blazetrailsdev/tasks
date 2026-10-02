---
title: "Port subscription_adapter/postgresql_test.rb and run it against PostgreSQL in CI"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable", "scripts"]
deps: ["port-actioncable-postgresql-adapter"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/subscription_adapter/postgresql_test.rb` (87 lines): 3 own cases, plus
the common suite's 8 and the channel-prefix case from
`port-actioncable-inline-async-and-test-adapters`, against a real
PostgreSQL.

**CI.** Add the file to a lane that already has the PostgreSQL service (the PG
lanes of the AR suite) and the AR test database config the Rails test reads
(`:14-21`). The other actioncable lane must not run it without the service.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/postgresql_test.rb`:
  - [ ] `clear active record connections adapter still works` (`:45`)
  - [ ] `default subscription connection identifier` (`:68`)
  - [ ] `custom subscription connection identifier` (`:75`)
- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/postgresql_test.rb` also includes the shared suite from `subscription_adapter/common.rb` and `channel_prefix.rb`; every included case runs under this class.

## Fidelity traps (predicted at authoring)

- [ ] **The PostgreSQL step is one of actioncable's own tests** and must run under `actioncable_only` (`ci-actioncable-only-diffs-run-minimal-test-lanes`), not only in the full matrix.
- [ ] **`skip "Couldn't connect to PostgreSQL"`** (`:29`) must not turn a missing service into a green run in CI. Skip locally; fail in the lane that claims to have the service.
- [ ] **The test's `setup`** establishes `ActiveRecord::Base`'s connection from the AR test config (`arunit`) and `teardown` calls `connection_handler.clear_all_connections!`. The test file may import activerecord; the package may not.
- [ ] **"clear active record connections adapter still works"** subclasses the adapter to expose `active?` (`!@listener.nil?`), broadcasts, calls `clear_reloadable_connections!`, and asserts the listener is still there: the subscription connection is not pooled.
- [ ] **The two identifier cases** query `pg_stat_activity` for `application_name` and expect `"ActionCable-PID-#{$$}"` and `"hello-world-42"`.
- [ ] **`test_long_identifiers`** (from the common suite) is the case that exercises the SHA1 arm end to end.
- [ ] **Adapter-only failures.** A case that fails only against PostgreSQL usually means the port dropped an arm the in-process adapters never reach; fix the adapter, do not loosen the test.
- [ ] **Changing a lane's `run:` line** can break `scripts/ci-suite-coverage.test.ts`'s fixture literals.

## Acceptance criteria

- [ ] The 3 own cases, the common suite's 8 and the channel-prefix case run against a real PostgreSQL in CI and are credited in `parity:test`.
- [ ] Two adapters on two servers with different `channel_prefix` values do not see each other's messages.
- [ ] The lane fails, not skips, when the service is unreachable.

## Definition of done

A CI run in which these cases skip does not close this story.

## Verification

```bash
ARCONN=postgresql pnpm vitest run packages/actioncable/src/subscription-adapter/postgresql.test.ts   # with the AR test database up
pnpm parity:test && pnpm parity:test:assertions
pnpm vitest run scripts/ci-suite-coverage.test.ts
```
