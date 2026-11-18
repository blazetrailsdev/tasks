---
title: "activesupport: CI gate holding parity:api and parity:test at 100%"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport, scripts]
deps:
  - activesupport-api-callbacks-residue
  - activesupport-api-dependencies-and-syntax-error-proxy
  - activesupport-api-parallelization-permanence
  - activesupport-api-singletons-core-ext-and-cache
  - activesupport-api-singletons-runtime-and-messages
  - activesupport-api-structure-misplaced-inheritance-arity
  - activesupport-api-subscriber-and-output-safety-residue
  - activesupport-api-test-case-and-time-helpers-residue
  - activesupport-inflector-test-loop-residue
  - activesupport-multibyte-chars-bang-methods
  - activesupport-safe-buffer-unsafe-method-loop
  - active-support-test-parallelization-threshold-unseated
  - activesupport-test-residual-singletons
  - activesupport-test-skip-receipts
  - activesupport-time-ext-all-range-readers
  - activesupport-time-with-zone-methods-for-time-tests
  - activesupport-unported-files-permanence-audit
  - cache-store-behavior-fetch-race-condition-protection
  - connection-pool-behavior-ts-twin
  - delete-hwia-extended-test-file-json-gem-encoding-duplicates
  - logger-log-at-forks-isolated-execution-state
  - port-activesupport-testing-helper-stubs
  - port-cache-connection-pool-and-encoded-key-behaviors
  - port-message-pack-shared-tests-into-cache-serializer
  - port-ordered-hash-and-safe-buffer-stubs
  - port-out-of-closure-activesupport-singleton-tail
  - relocate-core-ext-enumerable-rb-methods-and-converge-sole
  - time-travel-test-port-three-time-zone-cases
  - with-options-implicit-receiver-instance-eval-arm
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This is the final RFC 0246 story. It depends on every other story in the RFC.
Any story that `activesupport-unported-files-permanence-audit` files later is
added to these deps in the same PR.

## Acceptance criteria

- [ ] Add a CI check that enforces the full RFC 0246 definition of 100%. It
      fails when any of these holds for activesupport:
  - `parity:test`: Miss, Desc or Move > 0, or any ✗ file.
  - A skipped test has no `PERMANENT-SKIP:` line.
  - `parity:api` on a clean build: Miss or misplaced > 0, or inheritance or
    arity < 100%.
  - A row in `unported-files/activesupport.ts`, an activesupport scoped skip,
    or an activesupport row in `baseline.json` has a reason that does not
    start with `PERMANENT:`.
- [ ] The check runs on main and is green when this story merges.
- [ ] Record the final numbers in the RFC 0246 Changelog.
