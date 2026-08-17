---
title: "Detect dead Rails-name duplicate shims that satisfy the matcher with no callers"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Found in #5343 (`extra-surface-schema-cache-and-pool-sync-api`,
2026-07-26). Three separate instances, in only two files, of the same
defect: a **module-level function carrying a Rails method's name, called by
nothing**, while the live code did the same work by another route. Each one
satisfied `parity:api`'s name match, so the parity number was green while
no ported body actually made the call.

| Rails method                                                 | dead shim                                               | what the live code did                                         |
| ------------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------- |
| `SchemaCache#ignored_table?` (`schema_cache.rb:436`)         | `isIgnoredTable()`                                      | 6 sites called `isSchemaCacheIgnoredTable` from `ar-config.ts` |
| `ConnectionPool#connection_lease` (`connection_pool.rb:711`) | `connectionLease(pool)`, body `pool._connectionLease()` | 9 sites called `this._connectionLease()`                       |
| `SchemaReflection#empty_cache` (`schema_cache.rb:100`)       | exported `emptyCache()`                                 | 4 fallbacks inlined `new SchemaCache()`                        |

All three were fixed by porting Rails' actual shape (a private method on
the class) and re-pointing the call sites; each stayed `private`, so match
counts held at 37/37 and 70/70 while 7 wide-ratchet entries converged.

Three in two files suggests this is systemic, not local. The shape is
mechanically detectable: a function whose name matches a Rails method,
declared in the Rails-layout file, with **no callers in its own file**.

Note the interaction with
[[wide-call-analyzer-normalize-rails-private-underscore-prefix]]: the
`connection_lease` shim existed _because_ the live method was `_`-prefixed
and so never matched as a callee. Fixing the analyzer may remove the
incentive for this shape, and should probably land first.

## Acceptance criteria

- Add a detector (script or api-compare lint) for: TS function/method whose
  name matches a Rails method in the file's Rails counterpart, with zero
  call sites in the repo outside its own declaration.
- Run it across `activerecord` and inventory the hits. Report the count
  before fixing — that number is the finding.
- For each hit decide: port Rails' real shape and re-point callers (as
  #5343 did), or delete if a faithful port already exists elsewhere.
- Per [[project_dead_extra_surface_duplicates_encode_correct_rule]], check
  each dead copy for a rule the live path lost before deleting it; if a
  test imports the shim directly, re-point the test at the live path rather
  than dropping the assertion.
- Method match counts must not regress; wide-ratchet baseline should shrink.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
