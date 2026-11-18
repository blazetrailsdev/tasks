---
title: "activesupport: CI gate holding parity:api and parity:test at 100%"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps:
  [
    activesupport-inflector-test-loop-residue,
    activesupport-safe-buffer-unsafe-method-loop,
    activesupport-multibyte-chars-bang-methods,
    activesupport-time-with-zone-methods-for-time-tests,
    activesupport-time-ext-all-range-readers,
    activesupport-test-residual-singletons,
    activesupport-api-callbacks-residue,
    activesupport-api-test-case-and-time-helpers-residue,
    activesupport-api-dependencies-and-syntax-error-proxy,
    activesupport-api-subscriber-and-output-safety-residue,
    activesupport-api-parallelization-permanence,
    activesupport-test-skip-receipts,
    activesupport-unported-files-permanence-audit,
    activesupport-api-structure-misplaced-inheritance-arity,
    port-message-pack-shared-tests-into-cache-serializer,
    port-cache-connection-pool-and-encoded-key-behaviors,
    cache-store-behavior-fetch-race-condition-protection,
    logger-log-at-forks-isolated-execution-state,
    with-options-implicit-receiver-instance-eval-arm,
    relocate-core-ext-enumerable-rb-methods-and-converge-sole,
    port-out-of-closure-activesupport-singleton-tail,
  ]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This is the final RFC 0246 story. Once activesupport reaches 100% API and
test parity, CI should keep it there.

## Acceptance criteria

- [ ] Add a CI check that fails when activesupport `parity:test` Miss > 0, or
      `parity:api` Miss > 0, or when an activesupport skip lacks
      `PERMANENT-SKIP:`.
- [ ] Record the final numbers in the RFC 0246 Changelog.
