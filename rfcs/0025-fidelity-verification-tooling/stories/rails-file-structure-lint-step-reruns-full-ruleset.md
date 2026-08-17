---
title: "rails-file-structure method-order CI step re-runs the whole ruleset"
status: ready
updated: 2026-07-30
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #5423, which fixed the silent-empty manifest path for
`blazetrails/rails-private-jsdoc`.

That PR added `eslint/rails-private-jsdoc.config.mjs`, a standalone flat config
enabling exactly one rule, so the `rails-comparison` job runs:

```sh
pnpm exec eslint --no-inline-config --config eslint/rails-private-jsdoc.config.mjs packages
```

The sibling step for `blazetrails/rails-file-structure-method-order` still uses
the ROOT config:

```yaml
run: pnpm exec tsx scripts/build-rails-file-structure-manifest.ts && pnpm exec eslint packages/arel/src packages/activemodel/src
```

(`.github/workflows/ci.yml`, the "Rails file-structure method-order lint" step.)

Running the root config there re-runs the entire ruleset over both packages —
work the standalone Lint job already does — so the step pays a full duplicate
lint, and an unrelated rule violation fails the job named after API comparison
rather than the job named Lint. The manifest that step builds unlocks exactly
one rule; only that rule needs to run.

Two details the privates config had to get right and this one will too:

- `--no-inline-config` is required. Sources carry `eslint-disable` comments
  naming rules a single-rule config does not register, and each one otherwise
  becomes a "Definition for rule ... was not found" error (73 of them on the
  first attempt). Verify nothing disables the target rule inline before
  relying on this.
- The config duplicates the root config's `files` and `ignores` lists, so it
  needs a drift guard. See `eslint/rails-private-jsdoc.config.test.mjs`, which
  asserts the standalone lists still equal the root block's.

Not covered by `rails-file-structure-lint-rule-no-ops-in-lint-job`: that story
decides WHETHER the rule should be enforced in the Lint job. This one is about
the cost and blast radius of how the compare job invokes it, and applies
whichever way that decision lands.

## Acceptance criteria

- [ ] `eslint/rails-file-structure-method-order.config.mjs` exists, enabling
      only `blazetrails/rails-file-structure-method-order`, with `files` and
      `ignores` matching the root config's block for that rule.
- [ ] The "Rails file-structure method-order lint" CI step invokes it with
      `--no-inline-config` instead of the root config, and still passes.
- [ ] A drift guard test mirrors `eslint/rails-private-jsdoc.config.test.mjs`.
- [ ] Confirm no source disables the rule inline (so `--no-inline-config`
      costs no legitimate suppression).

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
