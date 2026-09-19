---
title: "migrator-run-returns-version-string"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Parked by assertions-tail-root-4 in `packages/activerecord/src/migrator.test.ts` ("migrator output when running single migration", `it.skip`).

Rails `activerecord/test/cases/migrator_test.rb:439-447` asserts `assert_equal("1", result)` for `migrator.run(:up, 1)`; trails' `MigrationContext#run("up", 1)` returns the number `1`. Not investigated beyond the type difference (Rails uses a `migrator_class` fake there, so check the return contract before changing anything).

## Acceptance criteria

- The converged body (`expect(result).toBe("1")`) passes; un-skip the test.
