---
title: "Nest sibling-class TS ports by class so parity:test's (class, name) keying applies"
status: draft
updated: 2026-08-30
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7241 taught `parity:test` to key description-only matches by (class, name)
when a Rails file's sibling test classes define the same test name
(`rejectsSiblingClassCandidate`, `scripts/test-compare/compare.ts`). The rule is
deliberately conditional on the TS port naming the class in a describe: a port
that flattens both sibling classes into one describe has nothing to key on, and
refusing the match there would report a ported test as missing.

That condition is currently doing a lot of work. Measured on the merge commit,
196 same-named tests across sibling classes span 47 Rails files
(`pnpm parity:test --sibling-classes` prints the inventory), and an experiment
that dropped the "TS names the class" condition moved 26 matches out of
`matched` (15783 → 15757, wrong-describe 171 → 145). Those 26 are Rails tests
credited against a SIBLING class's TS port purely because no class describe
exists to tell them apart — the mis-pairing the keying exists to prevent,
surviving in exactly the files whose ports are flat.

Mis-pairing is not just a counting artefact: the paired TS test is what
`recordGate` / `recordAssertion` / `recordKind` / `recordValue` score against,
so a wrong pair reports the wrong gate and the wrong assertion deltas.

## Converged shape

Nest those ports by class, the way Rails writes them — `describe("ForeignKeyTest")`
and `describe("CompositeForeignKeyTest")` under the file's outer describe, as
`packages/activerecord/src/migration/foreign-key.test.ts` already does — so the
class is recoverable on both sides and the (class, name) key applies. Ruby side:
each class is a separate `class …Test < ActiveSupport::TestCase` in one `.rb`
(e.g. `vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:453`
and `:878`).

Start from the files the 26 fall in; `--sibling-classes` names the candidates,
and re-running with the condition removed identifies them exactly. Test names
themselves must not change — only the describe nesting around them.

## Acceptance criteria

- [ ] The TS ports of the affected Rails files nest their cases under a describe
      named for the Rails test class, for every sibling class in the file.
- [ ] With those in place, removing the "TS names the class" condition from
      `rejectsSiblingClassCandidate` leaves `matched` unchanged — i.e. no test is
      matched across a sibling-class boundary any more.
- [ ] `pnpm parity:test --gates --check` stays at exit 0; no test name is
      renamed.
