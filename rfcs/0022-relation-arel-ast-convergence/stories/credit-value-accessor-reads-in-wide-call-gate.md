---
title: "credit-value-accessor-reads-in-wide-call-gate"
status: ready
updated: 2026-07-05
rfc: "0022-relation-arel-ast-convergence"
cluster: null
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

RFC 0022 sibling of `unify-join-values-storage-faithful-accessor` (PR #4645).
That PR unified `.joins` storage into a single insertion-ordered `_joinsValues`
store and converted the join builders (`build_join_buckets`,
`build_join_dependencies`, `build_joins`, `merge_joins`) to read the unified
`this.joinsValues` accessor. It could NOT remove the 10 `joins_values` entries
from `scripts/api-compare/call-mismatches-wide-exclude.json` (build_joins,
build_join_dependencies, build_join_buckets, apply_join_dependency, merge_joins,
associated) because the wide-call extractor cannot credit the reads.

Root cause: `extractCalls` in `scripts/api-compare/extract-ts-api.ts` (visit fn
~line 1698) records only `ts.isCallExpression` callees. A Rails value-method
read like `joins_values` is a method call in Ruby, but its faithful TS mirror is
a get-accessor READ (`this.joinsValues`) — a `PropertyAccessExpression`, never a
CallExpression — so it is never credited. Only ONE method in the whole repo
credits a value accessor (`countRecords` → `host.limitValue()`, via a host
METHOD). ~38 value-accessor call entries are permanently baselined for this same
reason.

### Measurements (done during PR #4645 — do not re-derive)

Two extractor variants were prototyped and measured against the wide ratchet.
IMPORTANT: the ts-api cache is keyed by the _source_ fingerprint, not the
extractor code — editing `extract-ts-api.ts` alone is a cache HIT and does
nothing. Run `rm -f scripts/api-compare/output/ts-api-cache/activerecord.json`
(and siblings) then `API_COMPARE_FORCE=1 pnpm api:compare --wide-calls`.

1. **Broad** (credit every non-callee `PropertyAccessExpression` name): wide
   ratchet shifts **+234 new / −868 converged**. The +234 arise because methods
   with previously-empty call sets (`if (!tsCandidateSets || … === 0) return;`
   in compare.ts ~line 1384) become subject to the gate once their reads count
   (e.g. `performed? → response_body`, `initialize → new`). Too broad.

2. **Scoped** to Rails VALUE_METHOD reader names — a new module const
   `VALUE_METHOD_READ_RE = /(?:^|[a-z])Values?$/` gating the branch, plus a
   helper `isCallCallee(n) = ts.isCallExpression(n.parent) && n.parent.expression
=== n` (declare the regex at MODULE TOP — a TDZ error bites if it sits just
   above `extractCalls`): wide ratchet shifts **−11 converged / +0 new**. Clean.
   Converges 4 of the 10 joins_values entries (`build_joins`,
   `build_join_buckets`, `build_join_dependencies` in relation/query-methods.ts,
   and `merge_joins` in merger.ts) plus 7 bonus value-accessor entries
   (`select_values` ×4, `original_value` ×3 in activemodel).

**The 6 stragglers** the scoped variant does NOT clear (why each PR #4645 left
its exclude entry in place):

- `relation.ts` `build_joins` / `build_join_buckets` / `build_join_dependencies`
  / `apply_join_dependency`: these are attributed to the relation.ts wrappers
  whose body is just `buildJoins.call(this, …)` (call-set `['call']`), NOT the
  query-methods function body that reads `joinsValues`. Clearing them needs
  transitive delegation-crediting (`X.call(this,…)` → credit X's _calls_, not
  just X's name as today).
- `relation/finder-methods.ts` `apply_join_dependency` and
  `relation/query-methods.ts` `associated`: trails' bodies genuinely do NOT read
  `joins_values` (the preloader handles eager loading; `whereAssociated` does the
  join). Faithfully porting Rails' `apply_join_dependency` /
  `WhereChain#associated` (which reads `joins_values`) would make them converge
  without a dead anchor.

## Acceptance criteria

- Ship the **scoped** extractor rule (variant 2) — it credits value-method
  reader reads with zero new mismatches. Add `extract-ts-api.test.ts` coverage
  for the rule and for `isCallCallee` (a call's callee is not double-recorded).
- Add transitive delegation-crediting for `X.call(this,…)` so the 4 relation.ts
  wrapper entries converge; faithfully port `apply_join_dependency` /
  `associated` to read `joins_values` so those two converge — clearing ALL 10
  joins_values entries (the remaining ones PR #4645 left).
- Reseed `call-mismatches-wide-exclude.json` removing every converged entry.
- `pnpm api:calls:wide` passes; `pnpm api:compare` parity % unaffected.
