---
title: "Writing-pool census baseline is taken in beforeAll, hiding module-scope pool leaks"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6172
claim: "2026-08-07T13:39:44Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: null
closed-reason: null
---

## Context

The writing-pool census guard added by PR #6126
(`packages/activerecord/src/cases/helper.ts`) takes its baseline in `beforeAll`,
which runs AFTER the test file's module body. A pool a file establishes at module
scope is therefore counted as part of its own baseline and never reported, even
though it outlives the file exactly like a mid-test leak: trails' connection
handler is module-level state shared by every file in a vitest worker, and
`setup_transactional_fixtures` pins and `verify!`s every writing pool in the next
file (`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:175-180` →
`connection_adapters/abstract/connection_pool.rb:335`).

Rails needs no equivalent: `ActiveRecord::TestCase` tears connections down
per-case, so nothing survives the file that opened it.

The lenient baseline was chosen to land the guard without a wide red — a strict
module-load baseline reported `Base` and `ARUnit2Model` (the legitimate per-file
setup pools) on all 22 files that call `establishConnection`, which needs the setup
path itself to be understood first, not just the leaking cases.

## Converged shape

Move the baseline to the setup module's own body (module load, before the test
file is imported), so the population is "pools that exist because the suite booted"
rather than "pools that exist once this file has finished loading". Then either:

- have the per-file setup pools (`Base`, `ARUnit2Model`) register themselves as
  baseline explicitly, since they are established by the shared setup path and not
  by the file under test; or
- give module-scope establishers a file-scoped teardown, which is the shape the
  already-correct sites in `connection-handling.test.ts` use.

Audit what the strict baseline reports before choosing — the 22 `establishConnection`
files are enumerated in the guard-against-leaked-writing-pools-in-test-teardown
story (done, PR #6126).

## Acceptance criteria

- [ ] The baseline is taken at setup-module load, not in `beforeAll`.
- [ ] A pool established at a test file's module scope and never removed reds that file.
- [ ] The guard is proven on a module-scope leak, naming the pool's connection descriptor.
- [ ] Green on SQLite, PG and MySQL.
