---
rfc: "0126-fidelity-tooling-continuation"
title: "Fidelity verification tooling — measurement correctness: verdicts that are wrong on main today"
status: active
created: 2026-08-27
updated: 2026-08-27
owner: "@deanmarano"
packages:
  - actionpack
  - actionview
  - activemodel
  - activerecord
  - activesupport
  - arel
clusters:
  - api-compare
  - lint
related-rfcs:
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0025-fidelity-verification-tooling"
  - "0108-call-gate-false-positives"
  - "0110-parity-skip-register-correctness"
  - "0120-extra-surface-gating-rollout"
  - "0121-internal-tag-accounting"
priority: 3
---

# RFC 0126 — Fidelity verification tooling: measurement correctness

## Summary

The active successor to `0025-fidelity-verification-tooling`, narrowed on
2026-08-27 to **measurement correctness only**. RFC 0025 has been `postponed`
since its five original tools were scoped, and `effectiveStoryStatus` downgrades
every `ready` story under a non-`active` parent to `draft` — so its open
tooling defects were unreachable from the ready queue. This RFC was carved out
the same morning to carry the schedulable ones, and was immediately too big to
schedule against (86 stories, 10,235 est-LOC, no story-level priority).

It was therefore split a second time, on **priority rather than subject**.
This RFC keeps the higher-priority half: every story whose deliverable changes
a verdict the tooling emits on today's `main`. The sibling
`0127-fidelity-tooling-signals-and-hygiene` takes the rest.

Carried at the split, plus one story returned from 0127 on 2026-08-27:
**45 stories, 5,415 est-LOC** (3 unsized), including the
one in-flight story (`test-compare-blind-to-define-method-loop-tests`).

## Charter

One test: **a story belongs here iff a number, baseline row, or gate verdict
that exists on today's `main` changes value when it lands.** The body must be
able to name the falsehood — a faithful port scored as missing / novel / a
dropped call, a divergence scored as a match, a gate red for faithful code or
green for unfaithful code, a green ratchet that verified nothing. While such a
verdict is wrong, every ratchet reading it is scoring the wrong thing and every
agent acting on it is acting on a false signal; that is why this half outranks
the sibling.

The shapes that land here, by the verdict they correct:

- **`parity:api` matching and coverage** — pairing a Ruby member with the wrong
  TS declaration (bodyless-outranks-body, owning-gem, ancestry chain,
  `resolveParent` ties, nested namespaces, reopened modules, transitive
  re-exports), the coverage denominator (nested classes, pinned operators,
  `arel.rb` outside `libPath`, `date/conversions.rb` mis-mapped,
  declaration-only credit, parameter names beside arity), and visibility
  stamped from `defineModule`.
- **The Ruby extractor's view of what Rails defines and calls** — metaprogrammed
  members, named-capture locals, `raise Class, msg`, hash and option keys.
- **`parity:api:extra` scoring** — stdlib `Comparable`, symbol-keyed
  `[included]`/`[extended]`, `@internal` on class members, file constants,
  `walkMixin` method-file scoping, nested-class allowances, the synthetic mixin
  constructor, config-key accessors.
- **The call-set / call-argument gates** — the `ownerRecordsNothing` blind
  spot, test-helper population leakage, fs-adapter and `_`-prefix crediting,
  value-equivalent constants, `none? → every`, the `key?` candidate decision.
- **`parity:test` and its gate extractor** — sibling-class and underscore-run
  name collisions, dynamically-named `it()`s, `define_method` loops, the
  `currentAdapter()` predicate, else-arm negation, inverted feature guards, and
  the `ASSERTION_REPORT_PACKAGES` marks that read 0/0/0 for six unmeasured
  packages.
- **Run integrity** — a `parity:api` run that replays a deleted worktree's
  artifacts and reports `OK`.
- **Rails-manifest-fed and test-hygiene ESLint rules whose current verdict is
  wrong** — the method-order bucket silently dropped on a last-segment
  collision, `no-standalone-associations` blind to aliased consts,
  `require-table-teardown`'s order-dependent diagnostics.

Package-agnostic: the fix lives in `scripts/api-compare/**`,
`scripts/parity/**`, `scripts/test-compare/**`, the manifest builders, or
`eslint/`, never primarily under `packages/**`.

## Out of scope (and where it lives instead)

- **Tooling work that changes no current verdict** —
  `0127-fidelity-tooling-signals-and-hygiene`: new measurement dimensions
  (visibility gate, raise-message signal, arity
  ratchet, `Mirrors:` integrity, the `detect-*` family, the deliberate-gate
  marker), guards against latent failures (manifest truncation and staleness,
  the worker-dispatch TDZ, extractor-schema fields, cache-key wiring tests, the
  `included do extend` split whose heuristic is still right today), ratchet /
  reseed / report mechanics, the `api-build-*` rollout, register and baseline
  hygiene, CI-cost and ergonomics work, and docs.
- **Port-convergence work** — a deliverable under `packages/**` — stays in 0025
  or belongs in `0023-surfaced-deviations`.
- **Extra-surface enrollment and gating rollout** — RFC 0120.
- **`@noRailsEquivalent` / privates-manifest accounting** — RFC 0121.
- **Call-argument descriptor grammar** — RFC 0099 / 0095.

The one-line test for a claimer filing a new tooling story: **does a committed
number, row, or verdict change value when this lands?** Yes → here. No → the
sibling.

## Rollout

No phase gating: the stories are independent defects in distinct files and are
parallel-safe. Story-level `priority` (markdown-owned frontmatter) was set at
the split for every story, in tiers 1–5 — the sibling RFC uses 6–10, so this
whole RFC sorts ahead of it in the global ready queue — on this order:

1. **False passes that retire or hide live divergence** — a baselined row that
   goes STALE and gets deleted for a divergence nobody fixed
   (`api-compare-bodyless-declaration-outranks-real-body`), a whole method
   family outside the measured population (`call-set-pairing-prefers-owning-gem`,
   `narrow-owner-records-nothing-call-gate-blind-spot`), a 100% score for a
   bodyless interface or a two-thirds-missing test file, and a ratchet verdict
   replayed from another worktree.
2. **Wrong headline numbers** — the coverage denominator, pinned operators,
   `arel.rb`, metaprogrammed members, the zeroed assertion marks, and an
   arity figure that reads 706/706 while 16 parameters are renamed.
3. **False positives that cost review rounds or force receipts** — named-capture
   locals, `raise Class, msg`, fs-adapter spellings, test-helper population,
   value-equivalent constants, the `_` prefix.
4. **Gate-extractor and extra-surface precision**, roughly by est-LOC ascending.

`extract-ts-api-stamp-mixin-section-visibility` depends on
`0082-ruby-ts-idiom-conversion-classes/converge-public-instance-methods-onto-one-helper`
and is itself a dependency of the sibling RFC's `add-visibility-parity-gate`.

## Notes for claimers

Every carried story was audited against `trails` `origin/main` on 2026-08-27 for
premise survival, but **numeric claims in bodies have drifted** and must be
re-derived before work starts:

- RFC 0084 folded `call-mismatches-wide-exclude/` into the single
  `call-mismatches-exclude/` tree. Any body citing the wide tree, a file inside
  it, or a row count against it is stale (`wide-call-analyzer-normalize-rails-private-underscore-prefix`
  in particular).
- `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
  moved from `scripts/api-compare/` to `scripts/parity/`. Bodies citing the old
  path with a line anchor need the anchor re-derived.
- `scripts/api-compare/extra-surface-allow.json` no longer exists (RFC 0080);
  `extra-surface-decide-config-key-accessors` is phrased against it and must be
  re-expressed against `@noRailsEquivalent` receipts.
- Decision-shaped stories (`none-every-alias-cannot-see-callback-negation`,
  `ruby-method-to-ts-key-predicate-candidate`,
  `extra-surface-decide-config-key-accessors`) sit here because their "yes"
  branch changes a current verdict; a recorded "no" closes them without one.

## Changelog

- 2026-08-27: created; 86 open stories carried from RFC 0025, which stays
  `postponed` with 32 open stories (port-convergence, infra, and slices owned by
  RFCs 0099/0110/0120/0121).
- 2026-08-27: split on priority. 42 stories / 4,820 est-LOC moved to
  `0127-fidelity-tooling-signals-and-hygiene` (new dimensions, guards, ratchet
  mechanics, hygiene, ergonomics); 44 / 5,415 kept here. Charter narrowed to
  measurement correctness.
- 2026-08-27: RFC-level `priority` set to 3. Story-level tiers 1–5 are
  unchanged and are what actually orders the ready queue, since every story
  carries an explicit `priority` (`story.priority ?? rfc.priority`).
- 2026-08-27: `parity-api-compares-parameter-names-beside-arity` returned from
  RFC 0127 at the owner's direction (p2). Its arity twin already scores
  706/706 on arel while two hand audits found 16 renamed parameters, so the
  figure it sits beside overstates fidelity today.
