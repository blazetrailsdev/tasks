---
title: "port-out-of-closure-activesupport-singleton-tail"
status: draft
updated: 2026-08-31
rfc: "0101-activesupport-out-of-closure-surface"
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

From the RFC 0105 reconciliation
(`reconcile-out-of-closure-activesupport-test-remainder`): the 1–2 case tail of
the out-of-closure activesupport remainder, 14 cases across 11 files, none
owned by an RFC 0101 story. Each is small enough that one PR covers the lot.

| Rails test file                                | remaining |
| ---------------------------------------------- | --------- |
| `message_encryptor_test.rb:9`                  | 2 stubs   |
| `benchmark_test.rb:5`                          | 2 stubs   |
| `core_ext/object/json_gem_encoding_test.rb:20` | 2 stubs   |
| `option_merger_test.rb:6`                      | 1 missing |
| `message_verifier_test.rb:10`                  | 1 stub    |
| `configurable_test.rb:6`                       | 1 stub    |
| `reloader_test.rb:5`                           | 1 stub    |
| `core_ext/benchmark_test.rb:6`                 | 1 stub    |
| `core_ext/kernel/concern_test.rb:6`            | 1 stub    |
| `core_ext/pathname/blank_test.rb:6`            | 1 stub    |
| `core_ext/pathname/existence_test.rb:6`        | 1 stub    |

All paths are under `vendor/rails/activesupport/test/`.

## Acceptance criteria

- All 14 cases implemented in their convention TS files; none left `it.skip`.
- Rails test names verbatim; no new `unported-files` rows.
- `pnpm parity:test` deltas non-negative.
- If the 700 LOC ceiling bites, ship what fits and file the residue as a
  sibling story against RFC 0101.
