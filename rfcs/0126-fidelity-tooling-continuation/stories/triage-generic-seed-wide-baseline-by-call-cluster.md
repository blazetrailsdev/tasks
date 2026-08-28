---
title: "Triage the 4871 generic-reason wide call-mismatch baseline entries by call cluster"
status: ready
updated: 2026-07-27
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The wide call-mismatch baseline under
`scripts/api-compare/call-mismatches-wide-exclude/` holds **5101 entries, of
which 4871 (95%) still carry the generic seed reason** left when the ratchet
landed:

> "Baseline (RFC 0047): wide call-set flag seeded when the wide ratchet landed;
> bucket (b) equivalent or (c) noise pending per-cluster burndown review."

That per-cluster burndown review never happened for most of the set. **RFC 0047
is `status: closed` and every story under it is `done`**, so the RFC reads as
complete while 95% of the artifact it produced is untriaged — which is why this
lands under 0025 (fidelity verification tooling, which already hosts the
wide-ratchet tooling stories) rather than under 0047 itself.

PR #5315 showed the seed text is **not** reliably "(b) equivalent or (c)
noise". `Relation#isGlobalScope` omitted Rails' `model` accessor call
(`relation.rb:1341-1343`, `registry.global_current_scope(model, true)`). It was
sitting in the baseline under that generic reason, and it turned out to be a
genuine one-line infidelity — fixing it made the baseline entry go stale. Its
sibling `isAlreadyInScope` had the identical bug and was only caught because
renaming it (unrelated work) pushed it into the compared population.

The baseline clusters cleanly by `call` name, which makes it burnable in
tractable chunks rather than 4871 individual judgements. Largest clusters:

| call     | entries |     | call       | entries |
| -------- | ------- | --- | ---------- | ------- |
| `new`    | 193     |     | `model`    | 83      |
| `first`  | 121     |     | `call`     | 70      |
| `map`    | 119     |     | `fetch`    | 70      |
| `delete` | 99      |     | `match?`   | 69      |
| `any?`   | 88      |     | `merge`    | 68      |
| `key?`   | 86      |     | `include?` | 58      |

The `model` cluster (85 entries when audited, 2 already converged by #5315) is
carved out into [[converge-relation-model-accessor-reads]] and
[[converge-model-accessor-reads-outside-relation]]. This story is the
**method** plus the next cluster or two, not the whole 4871.

There is precedent for the output format: RFC 0032's
`verify-value-accessor-read-wide-entries-per-entry` (done), and entries already
carrying specific text such as "Per-entry verified (RFC 0032 wide-entry
verification): …" in
`connection-adapters/postgresql/database-statements.json`.

## Acceptance criteria

- A documented, repeatable procedure for cluster triage: select entries by
  `call` name across the baseline tree, read each against its Rails body, and
  sort into (a) real omission → fix, (b) equivalent → keep with a _specific_
  per-entry reason, (c) noise → keep with a specific reason.
- At least one further cluster fully triaged end-to-end as the worked example
  (suggest `new` or `first` — largest, and `new` likely splits cleanly between
  `model.new` omissions and genuine Ruby-only constructor calls).
- Every entry touched loses the generic RFC 0047 seed text in favour of a
  specific reason, so re-audits do not re-derive the same conclusions.
- Real omissions found are either fixed in-scope (if one-liners, like the
  `model` accessor cases) or filed as their own stories with Rails
  `file:line` context.
- `lint-call-mismatches-wide.ts` stays green; the baseline only shrinks.
- Remove converged entries by hand, not via a full `--write` reseed: `--write`
  re-serializes unrelated files' escaped em-dashes into literal ones, adding
  churn outside the story's scope.
- Remaining cluster sizes recorded so the next agent can pick up without
  re-deriving the inventory.

## Mechanism retired — 2026-08-17

**The `call-mismatches-wide-exclude/` tree no longer exists** — RFC 0084 folded it
into `call-mismatches-exclude/`. Re-express against the merged tree.

## Re-verified 2026-08-17 (ready sweep)

Still valid, and **materially better than filed**. RFC 0084 folded
`call-mismatches-wide-exclude/` into the single `call-mismatches-exclude/` tree, so the
population is now measurable in one place. Re-counted 2026-08-17:
**1,637 rows total, of which 1,115 (68%) still carry the generic
"Baseline (RFC 0047)" seed reason** — down from the 5,101 / 4,871 (95%) this
story was filed against. The triage is still unstarted but the job is roughly
a third the size. Re-scope the clustering against the merged tree.
