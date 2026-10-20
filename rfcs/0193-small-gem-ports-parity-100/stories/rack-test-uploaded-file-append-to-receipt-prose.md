---
title: "rack-test UploadedFile#append_to: drop prose from the String.new receipt or converge onto rbStrSNew"
status: ready
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
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

CLAUDE.md § "Fidelity is the job": a receipt is `PERMANENT` or
`CONVERGEABLE <story-id>` and carries no prose. `packages/rack-test/src/uploaded-file.ts:88`
carries `@missingRailsArgs new — PERMANENT: a JS string is immutable, so Ruby's reusable
`String.new`buffer is a sized`Uint8Array``. The Rails site is
`UploadedFile#append_to` (`vendor/rack-test/v2.2.0/lib/rack/test/uploaded_file.rb`),
whose `String.new` buffer is reused across reads. The prose shows up as the
baseline reason in call-arg-mismatches.

## Acceptance criteria

- [ ] The receipt is a bare `PERMANENT`, or the call converges onto
      ruby-compat's `rbStrSNew` (as `CookieJar#for` did in
      rack-test-parity-residual) so no receipt is needed.
- [ ] `pnpm parity:api:calls:args` green, and no rack-test row carries prose.
