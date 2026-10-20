---
title: "rack-session: three encryptor naming rows and one moved const to zero, then enroll in both gates"
status: ready
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-session
packages: ["rack-session"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on trails `main` @ `5c642754f3` (2026-10-20). rack-session is in neither `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts:106`) nor `GATED_PACKAGES` (`scripts/api-compare/extra-surface-mark.ts`), and still carries residue on both dimensions, which no story owns:

- `call-arg-mismatches.json`, three unreceipted `naming` rows in `encryptor.ts`:
  - `initialize` `slice!(hmac_secret, 0, 32)` vs TS `ref:b`
  - `cipher_secret_from_message_secret` `digest(constructor, cipher_secret, message_secret)` vs TS `ref:from, ref:from`
  - `compute_signature` `digest(constructor, hmac_secret, signing_data)` vs TS `ref:from, ref:from`
- `pnpm parity:api:extra --package rack-session`: `cookie.ts` 0 novel / 1 moved, `RACK_SESSION_UNPACKED_COOKIE_DATA` (Rails defines it on `Rack::Session::Cookie`, cookie.rb; TS exports it as a module-level const).

Per the RFC's Non-goals, enrolling is the last criterion of the story that burns the surface to zero.

## Acceptance criteria

- [ ] The three encryptor rows converge (bind the Ruby-named local and pass it), with no receipt; 0 rack-session rows in `call-arg-mismatches.json`.
- [ ] `RACK_SESSION_UNPACKED_COOKIE_DATA` sits where Rails defines it; `parity:api:extra --package rack-session` reports 0 novel / 0 moved.
- [ ] rack-session is added to `NAMING_ENROLLED_PACKAGES` and to the extra-surface gate, and both gates stay green.
