---
title: "activerecord: verify every source-side parity axis at 100% and pin each gate at zero"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: closeout
packages: ["activerecord"]
deps:
  - activerecord-port-associations-eager-load-bang
  - activerecord-deduplicable-deduplicated-and-unary-minus
  - activerecord-core-attributes-for-inspect
  - activerecord-encryption-contexts-thread-mattr-accessors
  - activerecord-extended-deterministic-queries-core-queries-find-by
  - activerecord-relation-encode-with-and-strict-loading-scope
  - activerecord-delegation-encode-with-and-class-specific-relation-name
  - activerecord-result-indexed-row-to-h
  - activerecord-type-registry-copy-and-serialized-inspect
  - activerecord-inheritance-residue-delegate-class-supers
  - activerecord-disable-joins-association-scope-add-constraints-arity
  - activerecord-retire-migrator-index-helpers-skip
  - activerecord-retire-check-pending-skip
  - activerecord-retire-class-attribute-slot-skip
  - activerecord-retire-no-touching-klasses-skip
  - activerecord-score-core-object-protocol-names
  - activerecord-lifecycle-hook-semantics-audit
  - activerecord-test-fixtures-method-missing-accessors
  - activerecord-converge-alias-tracker-hash-default
  - activerecord-converge-preloader-through-reduce-merge
  - activerecord-converge-inheritance-find-sti-class-rows
  - activerecord-converge-insert-all-builder-rows
  - activerecord-converge-mysql2-cast-result-args
  - activerecord-converge-load-from-sql-instantiate-instance-of
  - activerecord-converge-build-where-clause-constructor-order
  - activerecord-converge-statement-cache-execute-async-arm
  - activerecord-converge-type-caster-connection-with-connection
  - activerecord-converge-sqlite3-reconnect-rollback
  - activerecord-verify-and-pin-protocol-bodies
  - activerecord-verify-and-pin-migration-compatibility
  - activerecord-option-keys-missing-in-ts
  - activerecord-deps-lint-to-zero
  - activerecord-triage-structural-duplicates-of-ruby-compat
  - parity-100-rehome-postponed-rfc-dependencies
  - port-hash-eql-rows-surfaced-by-scoring
  - port-remaining-class-hosted-accessor-instance-seats
  - port-non-accessor-rows-from-level-keyed-set
  - compatibility-module-members-unmeasured-by-parity-api
  - enroll-activerecord-in-protocol-call-mapping
  - converge-activerecord-dropped-block-arms-remainder
  - converge-same-name-second-owner-call-rows
  - burn-down-rfc0126-repairing-surfaced-call-rows
  - burn-down-the-ambiguous-parent-remainder
  - port-destroy-association-async-job
  - yaml-column-safe-coder-through-psych
  - schema-cache-dump-and-load-through-psych
  - serialize-accepts-yaml-module-as-coder
  - with-yaml-fallback-through-yaml-dump
  - ruby-compat-has-no-marshal-for-schema-cache-and-debug
  - promote-arity-mismatches-to-ratchet
  - name-stories-for-activerecord-malformed-deviation-receipts
  - convergeable-tag-story-id
  - converge-djar-deferred-chain-walk-mode
  - sync-reads-of-async-reflection-retire-with-rfc-0073
  - association-helpers-extracted-for-the-collection-proxy-remainder-3
  - sync-collection-mass-assignment-refuses-rails-replace
  - generated-attribute-methods-name-comes-from-const-set
  - update-must-call-assign-attributes-carried-from-0087
  - union-order-clauses-is-a-second-spelling-of-ruby-array-union
  - pg-lookup-cast-type-resolves-only-warmed-type-names
  - disambiguate-association-vs-collection-proxy-accessor
  - base-constructor-calls-init-internals-not-activemodel
  - eliminate-pending-counter-cache-deferral-via-lazy-target-resolution
  - insert-all-constructor-reads-the-schema-cache-at-its-rails-call-sites
  - cache-version-fast-path-reads-global-default-timezone
  - converge-collection-writer-isthenable-dual-returns
  - retire-ids-name-helper-constructor-dispatch
  - converge-has-one-builder-define-writers
  - mysql-quote-string-escapes-without-with-raw-connection
  - port-multibyte-chars-and-string-mb-chars
  - pg-quote-string-escapes-without-with-raw-connection
deps-rfc:
  - 0178-activerecord-arms-parity-100
  - 0179-api-compare-crediting-rules
  - 0180-activerecord-receipt-parity
  - 0181-activerecord-member-placement
  - 0182-activerecord-error-parity
  - 0183-activerecord-excluded-source-files
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The last story of RFC 0174. Re-measure on a clean build (`pnpm build`, then the `parity:*` commands) and
record the final table against the RFC's § "Baseline". Two stories are blocked on non-ratified gaps
(`activerecord-port-trilogy-adapter`, `activerecord-fixture-initialize-prepend-constructor`) and are named
in the final table rather than depended on; several prior-art stories in other RFCs are blocked too
(RFC 0123) and are listed as the remaining residue if still open.

## Acceptance criteria

- [ ] `pnpm parity:api` activerecord: methods, files, inheritance, arity, params, pins at 100%; excluded files only trilogy (while blocked); global skip only the CLAUDE.md-ratified names; scoped skip only `fixtures.rb#initialize` (while blocked).
- [ ] `call-mismatches-exclude/activerecord/` holds no shard; `parity:api:calls`, `:calls:args`, `:params`, `:predicates`, `:extra:gate` (rowless, no inlined bodies), `:arms:throws`, `:blocks`, `:pins`, `:parents`, `:receipts:gate` green at 0.
- [ ] Report-only axes read 0 for activerecord: arms (both directions), moves, returns, duck-types, deps, option keys, literals, structural duplicates.
- [ ] `rails-error-parity-exclude.json` and `rails-callback-invocations-exclude.json` hold no activerecord file.
- [ ] Every remaining receipt is PERMANENT and tabled against its CLAUDE.md section, or CONVERGEABLE naming an open story listed in the table.

## Verification

```bash
pnpm build && pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate && pnpm parity:api:arms:throws && pnpm parity:api:blocks && pnpm parity:api:pins && pnpm parity:api:receipts:gate && pnpm parity:test && pnpm parity:test:assertions
```
