---
title: "Detect name-matched tests with hollow bodies (pass against broken impl)"
status: draft
updated: 2026-07-15
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4892 fixed a real Rails deviation (`Notifications.instrument`/`instrumentAsync`
did not yield the payload, so `AbstractAdapter#log` could not thread
`notification_payload` into `perform_query`). The deviation survived because
**six tests named for exactly that behaviour had hollow bodies** — they were
name-matched to Rails but never exercised the behaviour, so they passed against
the broken implementation:

- `notifications.test.ts` — `subscribe to events where payload is changed during
instrumentation` and `subscribe to events can handle nested hashes in the paylaod`
  passed a payload and asserted it came back unchanged, never mutating it in a
  block. Rails' originals (`activesupport/test/notifications_test.rb:44-63`)
  mutate `payload` inside the block; that mutation IS the test.
- `notifications.test.ts` / `notifications/instrumenter.test.ts` — three tests
  literally named `... yields the payload for further modification` passed an
  empty `() => {}` block and modified nothing.

All six passed before and after the fix until their bodies were rewritten; the
7 rewritten assertions then failed against the pre-change source. `test:compare`
matches our tests to Rails **by name**, so a hollow body is invisible to it: the
name reports coverage the body does not provide. This is a false-negative class
in the parity signal, not a one-off.

Precedent that this recurs per-cluster rather than systematically:
`serialization-nested-include-test-hollow-body` (0055) and
`validations-test-body-rails-fidelity` (0048) — both closed as one-off body
rewrites. No tooling detects the pattern.

## Acceptance criteria

- [ ] Quantify the class: sweep name-matched tests for hollow bodies — an
      `it(...)` whose name asserts a behaviour (`yields`, `is changed during`,
      `modifies`, `raises`, ...) but whose body has no assertion tied to it, or
      passes an empty/no-op callback where the Rails original passes a block
      that mutates or raises. Report a count and the worst offenders.
- [ ] Decide the durable mechanism and land it: a lint rule (RFC 0025 already
      ships three) and/or a `test:compare` signal that flags a name-matched test
      whose body cannot fail — e.g. empty arrow callbacks passed to an API whose
      Rails counterpart yields, or a test with zero `expect` calls.
- [ ] Where cheap, prove the sweep by fixing the highest-value hollow bodies
      against their vendored Rails originals. NEVER rename a test to match a
      hollow body — fix the body (CLAUDE.md).
- [ ] Verify each rewritten body actually fails against the pre-fix behaviour,
      so the sweep does not just add more tests that cannot fail.

## Notes

Scope the detector before the burndown — a full-tree body-vs-Rails diff is far
larger than one PR. Land the measurement first, then file per-cluster fixes.
