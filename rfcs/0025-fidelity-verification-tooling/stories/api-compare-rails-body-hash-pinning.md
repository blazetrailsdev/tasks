---
title: "api:compare source-hash pinning — detect upstream Rails body drift on matched methods"
status: ready
updated: 2026-07-01
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

api:compare validates method NAMES (plus advisory arity/options-keys/literals/
call-set), but no artifact records which Rails source a matched TS method was
ported against. Consequences: (a) when `vendor/rails` is bumped, methods whose
Ruby bodies changed upstream rot silently — nothing produces a "these N
methods changed, re-verify their ports" list; (b) nothing distinguishes a
carefully-ported body from an accidental name match (see the RFC 0048
tainted-done finding in `require-canonical-schema-unwrap-as-const`: green +
name-matched ≠ faithful).

Fix: **source-hash pinning.** For every name-matched (Ruby, TS) pair, record a
stable hash of the Rails method's body source in a committed manifest, and
report pairs whose pinned hash no longer matches the current vendored source.

Where the pieces live:

- Ruby extraction: `scripts/api-compare/extract-ruby-api.rb` (~1,984 lines)
  already walks every method definition per file; it has the def source
  range, so emitting a normalized body digest (strip leading indentation +
  trailing whitespace per line, then sha256) is incremental.
- Matched pairs: `scripts/api-compare/compare.ts` builds the name-matched
  pair set (mixin-expanded); the pin manifest keys off the same identity it
  already uses (ruby file + entity + method name).
- Ratchet precedent: `scripts/api-compare/call-mismatches-exclude.json` +
  `lint-call-mismatches.ts` (baseline, only-shrink, stale-entry detection) —
  reuse the same shape for the pin manifest / drift lint.
- Manifest artifacts precedent: `scripts/build-rails-error-manifest.ts` et al
  generate committed JSON from vendored Rails.

Design notes:

- Pins are OPT-IN per pair and populated over time (a pair with no pin is
  simply unpinned — report count, don't fail). Backfill can start with pairs
  verified by convergence stories going forward; a bulk "pin everything at
  current hash" is acceptable as a floor since the current vendored tree is
  the de-facto baseline anyway.
- Normalize before hashing so pure indentation/comment churn doesn't fire;
  hash the def body only (not the surrounding class).
- Two failure classes for the lint: **drift** (pinned hash ≠ current vendored
  hash → upstream changed; re-verify the port, then re-pin) and **stale pin**
  (pinned method no longer exists / pair no longer matches → remove entry).
  Only-shrink does not apply here (pins grow); the lint instead enforces that
  every pin resolves and matches.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` emits a normalized per-method body digest into the
      Ruby manifest (whitespace-insensitive; body-only).
- [ ] A committed pin manifest (e.g.
      `scripts/api-compare/body-pins.json`) maps matched-pair identity →
      pinned digest; a generator subcommand pins/re-pins pairs
      (`--pin <ruby-file>` / `--pin-all` for the bulk floor).
- [ ] A lint script (CI job, same pattern as `lint-call-mismatches.ts`) fails
      on drift (pin ≠ current vendored digest) and on unresolvable/stale pins,
      with a per-pair report naming the Rails file:method that changed.
- [ ] api:compare summary line reports pinned/unpinned counts per package
      (advisory; parity % unchanged).
- [ ] Unit tests cover: digest normalization (indentation/comment churn does
      not change the digest), drift detection on a body edit, stale-pin
      detection on method removal/rename.
- [ ] Docs: a short section in `scripts/api-compare/` header docs (compare.ts
      usage block) describing the pin lifecycle: port → verify → pin → (Rails
      bump) → drift report → re-verify → re-pin.
