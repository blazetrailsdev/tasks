---
title: "activemodel: verify every parity axis at 100% and pin each gate at zero"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: closeout
packages: ["activemodel"]
deps:
  [
    "activemodel-port-type-value-limit-precision-scale-and-registry-copy",
    "activemodel-dirty-init-attributes-arity",
    "activemodel-port-version-and-gem-version",
    "activemodel-name-match-operators",
    "activemodel-score-core-object-freeze-and-initialize-clone",
    "activemodel-lifecycle-hook-semantics-audit",
    "activemodel-converge-attribute-methods-call-rows",
    "activemodel-converge-secure-password-bcrypt-password",
    "activemodel-converge-registration-json-date-comparability-rows",
    "activemodel-option-keys-to-zero",
    "activemodel-audit-permanent-receipts-root",
    "activemodel-audit-permanent-receipts-subdirs",
    "activemodel-enroll-in-extra-surface-gate-rowless",
    "activemodel-converge-moves-residue",
    "activemodel-verify-and-pin-protocol-bodies",
    "activemodel-converge-dropped-block-arms",
    "activemodel-converge-invented-control-flow-arms-type",
    "activemodel-converge-invented-control-flow-arms-rest",
    "activemodel-duck-type-instanceof-to-respond-to",
    "activemodel-map-railtie-test-onto-trailtie",
    "activemodel-unskip-attribute-and-type-mutation-tests",
    "activemodel-port-marshal-and-yaml-error-tests",
    "activemodel-relocate-ts-only-tests-to-trails-siblings",
    "port-hash-eql-rows-surfaced-by-scoring",
    "port-non-accessor-rows-from-level-keyed-set",
    "port-remaining-class-hosted-accessor-instance-seats",
    "attribute-set-to-h-alias-unported",
    "inline-is-mass-assignment-empty-into-assign-attributes",
    "rails-test-name-parity-rollout-activemodel",
    "test-compare-lint-and-serializers-json-mapping",
  ]
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

The last story of RFC 0173. Re-measure on a clean build and turn each remaining activemodel ratchet
into a hard zero. `activemodel-api-initialize-concern-constructor` is blocked on a TS-language gap and
is the one allowed exception until ruby-compat grows a construction hook — this story names it in the
final table rather than depending on it. `test-compare-lint-and-serializers-json-mapping` (RFC 0123,
blocked) brings `lint_test.rb` into the population and must land before the test axis can read 100%.

## Acceptance criteria

- [ ] `pnpm build && pnpm parity:api`: activemodel methods 100%, files 100%, inheritance 100%, arity 100%, params 100%, pins 100%, excluded file 0, scoped skip 0 (or 1 while `activemodel-api-initialize-concern-constructor` is blocked), global skip = ratified hooks only.
- [ ] `:calls`, `:calls:args` (no activemodel shard), `:params`, `:predicates`, `:extra:gate` (activemodel rowless), `:arms:throws`, `:blocks`, `:pins`, `:receipts:gate` green with activemodel at 0.
- [ ] `pnpm parity:test` activemodel 100% with 0 skipped, 0 extra, all files; `parity:test:assertions` 0/0/0.
- [ ] `parity:api:arms:report`, `:moves`, `:returns`, `:duck-types`, option keys: no activemodel rows.
- [ ] Every remaining activemodel receipt is PERMANENT and tabled against its CLAUDE.md section in the PR body.
