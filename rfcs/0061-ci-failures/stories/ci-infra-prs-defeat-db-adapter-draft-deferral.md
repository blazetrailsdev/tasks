---
title: "ci.yml edits force db_adapter_affected, so draft deferral never applies to CI-infra PRs"
status: draft
updated: 2026-09-17
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Not a Rails deviation: `.github/workflows/ci.yml` is CI configuration with no
Rails counterpart, so there is no gem path to converge toward. This is a sized
CI follow-up.

`postgres-tests` and `maria-tests` are draft-deferred — their `if:` is meant to
keep the expensive adapter matrix off draft PRs until they are marked ready
(`.github/workflows/ci.yml:1213-1219`, `:1412-1418`):

```yaml
github.event_name != 'pull_request' ||
github.event.pull_request.draft == false ||
needs.changes.outputs.db_adapter_affected == 'true' ||
contains(github.event.pull_request.labels.*.name, 'run-db-adapters')
```

**That deferral never applies to a CI-infrastructure PR.** `INFRA_RE`
(`ci.yml:109`) includes `\.github/workflows/ci\.yml$`, and `INFRA_CARVEOUT_RE`
(`:110`) carves out only a named set of `scripts/` paths — not `ci.yml`. So the
match at `:280` calls `force_all_affected()` (`:169-188`), which sets
`db_adapter_affected=true` along with every other gate, and the third arm above
fires unconditionally. Observed on trails#7856: a 1-file, 21-line `ci.yml` diff
touching nothing under `DB_ADAPTER_RE` (`:112`) ran the full PG + MariaDB
matrix on every draft push.

The blanket sweep is defensible in general — an infra change can affect
anything, so re-running everything is the safe default. The question this story
settles is whether it should also defeat the _draft_ deferral specifically,
which is a cost control rather than a correctness gate. A `ci.yml` PR is
typically iterated on as a draft across many pushes, which is exactly the case
the deferral exists for, and it is also the PR shape most likely to need the
adapter lanes at least once before merge.

## Converged shape

Options, to be decided in the story rather than pre-judged here:

1. Leave as-is and document the interaction at `INFRA_RE` — the sweep is
   correct-by-design and a `ci.yml` PR _should_ exercise the adapter lanes.
2. Carve `\.github/workflows/ci\.yml$` out of the `db_adapter_affected` arm
   only (keeping every other gate forced), so a CI-infra draft defers the
   adapter matrix like any other draft and picks it up on ready / the
   `run-db-adapters` label.
3. Narrow the sweep for a `ci.yml`-only diff the way the existing trivial-diff
   helpers (`:150-167`) already narrow `package.json` / `vitest*.config.ts`
   changes.

Whichever is chosen, the interaction should end up stated in a comment at
`INFRA_RE`, since it is currently only discoverable by tracing three hops.

## Acceptance criteria

- A decision recorded among the options above, with the chosen one implemented
  or the no-change outcome documented at `INFRA_RE`.
- If deferral is restored for CI-infra drafts: a draft PR touching only
  `ci.yml` does not run `postgres-tests` / `maria-tests`, and both still run on
  ready, on the `run-db-adapters` label, and on `main`.
- `scripts/ci-suite-coverage.test.ts` still passes, and the `ci` aggregator's
  `DB_ADAPTERS_DRAFT_DEFERRED` skip-reason (`:2153`) stays consistent with the
  new gate.
