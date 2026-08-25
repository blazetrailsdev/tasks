---
title: "Tag the async relation state @noRailsEquivalent PERMANENT, and converge or downgrade _asyncLoad"
status: done
updated: 2026-08-19
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: 6735
claim: "2026-08-19T11:35:05Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by a private-member audit of `relation.ts` against
`scripts/api-compare/output/rails-api.json` (every Rails method name, all
packages, all visibilities) plus the Rails ivar set. `relation.ts` carries 46
private/protected members; 16 have no Rails counterpart, and 13 of those are
owned by open stories in this RFC. The residue is the async machinery, which is
**not** invented bloat — it is JS runtime reality — but ships **untagged**, so
it reads as unexplained invented state to the next auditor.

CLAUDE.md is explicit that the tag is the only sanctioned exception to "no
extra abstraction" and that the reason is reviewed:

> If you genuinely need one, declare it with a `@noRailsEquivalent <reason>`
> JSDoc tag; that tag is the only sanctioned exception and the reason is
> reviewed.

The precedent for exactly this class of deviation already exists in the package
— `ar-config.ts:55`:

> `@noRailsEquivalent PERMANENT — Rails posts async queries to a
Concurrent::ThreadPoolExecutor (active_record.rb:288, connection_pool.rb:717).
Concurrent-ruby is a gem, not a Rails class, so there is no Ruby file to
mirror. JS has one thread…`

Three members in `relation.ts` need the same treatment. Their current state
differs, so do not treat them uniformly:

| member              | line   | today                                              |
| ------------------- | ------ | -------------------------------------------------- |
| `_loadAsyncPromise` | `:540` | **no doc comment at all** — a bare `private` field |
| `_asyncLoad`        | `:545` | documented, and cites Rails (`relation.rb:1142`)   |
| `_loadToken`        | `:549` | documented, no Rails citation, no tag              |

- **`_loadAsyncPromise`** memoizes the in-flight promise from `loadAsync()`.
  Rails' counterpart state is `@future_result` (`relation.rb:91`, `:1148`),
  which holds a `FutureResult` backed by a thread pool. trails holds a Promise
  because JS has one thread. Genuinely permanent, and currently undocumented.
- **`_loadToken`** is a monotonic counter bumped on `reset()`/`reload()` so an
  in-flight `toArray()` can detect it lost the race and skip committing stale
  records. Rails has no analogue **and cannot** — `exec_queries` is synchronous,
  so no reset can land mid-load. Permanent, a direct consequence of the async
  port.
- **`_asyncLoad`** is the weakest of the three and must **not** be tagged
  `PERMANENT` without thought. Its comment already maps it to Rails: `load_async`
  calls `exec_main_query(async: ...)` (`relation.rb:1142`). So Rails threads this
  as a **method parameter**; trails stores it as a **field** because
  `execMainQuery` is called without arguments. That is a shape deviation with a
  convergence target (thread the flag as a parameter, as Rails does), not a
  language shortcoming. Tag it as the deviation it is — or converge it — but do
  not bless it as permanent.

## Converged shape

Two `PERMANENT` tags and one honest disposition, all justified at the call site
(never in a PR body), following the `ar-config.ts:55` wording pattern: name the
Rails counterpart with its file and line, then say what about JS makes the port
impossible rather than merely inconvenient.

- `_loadAsyncPromise` → `@noRailsEquivalent PERMANENT`, citing `@future_result`
  (`relation.rb:91`, `:1148`) and `Concurrent::ThreadPoolExecutor` vs a Promise.
  Cross-reference the existing `ar-config.ts:55` tag so the two read as one
  decision.
- `_loadToken` → `@noRailsEquivalent PERMANENT`, stating that Rails'
  `exec_queries` is synchronous so the reset-mid-load race it guards cannot
  arise in Ruby.
- `_asyncLoad` → either thread the flag as a parameter to `execMainQuery`,
  matching `relation.rb:1142`, **or** tag it as a non-permanent deviation naming
  that as the target. Prefer converging if it is a local change; say which you
  chose and why in the PR.

Remember CLAUDE.md's rule that a documented deviation is a burndown ledger entry,
not a settled decision — `PERMANENT` is only for the two where Ruby genuinely
has nothing to converge onto.

**This will not move a gate number**, and the story should not claim otherwise:
`parity:api:extra` does not score underscore-prefixed or private members, which
is precisely why this state has stayed invisible. The value is reviewer-facing —
the next person auditing `relation.ts` sees three explained members instead of
three unexplained ones.

## Acceptance criteria

- [ ] `_loadAsyncPromise` and `_loadToken` each carry a `@noRailsEquivalent
PERMANENT` tag whose reason names the Rails counterpart (or states there is
      none) with file and line, and says what about the JS runtime makes it
      permanent.
- [ ] `_asyncLoad` is either converged to a parameter threaded through
      `execMainQuery` per `relation.rb:1142`, or tagged as a **non-permanent**
      deviation naming that convergence as the target.
- [ ] No member is tagged `PERMANENT` merely because converging is awkward —
      only where Ruby has nothing to converge onto.
- [ ] `pnpm parity:api:detached` (detached-JSDoc-tag lint) passes — the tags are
      attached to their declarations, not floating above blank lines.
- [ ] `pnpm parity:api:extra --package activerecord` is unchanged at 2 novel /
      3 moved for `relation.ts` — this story documents, it does not delete.
- [ ] `pnpm typecheck` clean; `parity:api` / `parity:test` deltas non-negative.
