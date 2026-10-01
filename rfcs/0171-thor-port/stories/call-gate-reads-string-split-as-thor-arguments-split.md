---
title: "call-gate-reads-string-split-as-thor-arguments-split"
status: draft
updated: 2026-10-01
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Arguments#parse_hash` calls `String#split` on a shifted argument:
`key, value = shift.split(":", 2)` (`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:98`).
The same class defines a singleton `self.split(args)` (`arguments.rb:8-17`).

`pnpm parity:api:calls` reads the `parse_hash` call as a call to the ported
`Arguments.split` and reports `parse_hash  split` as missing
(`"missing": ["split → split|_split"]`, `"receivers": {"split": ["expr"]}` in
`scripts/api-compare/output/call-mismatches.json`). The port makes the call
through ruby-compat's `stringSplit`
(`packages/trailties/src/thor/parser/arguments.ts`, `parseHash`), because JS
`split(":", 2)` drops the rest of the value after the first colon.

The receiver kind is already recorded. The call is on an expression, inside an
instance method, and the only same-named definition in the file is a singleton
method. An instance body cannot reach `self.split` through `shift.split`.
`rubyCallToTsForReceivers` (`scripts/api-compare/compare.ts`) already reads
receiver kinds for `new`.

trails#8347 carries `@missingRailsCall split — CONVERGEABLE <this story>` on
`parseHash`.

## Acceptance criteria

- [ ] A Ruby call whose receivers are all `expr` (never `self`, never a
      constant) is not matched to a same-file method that is defined only on
      the singleton, when the calling body is an instance method.
- [ ] `parse_hash  split` no longer appears in the thor call-mismatch
      artifact, and the `@missingRailsCall split` tag on `parseHash` is
      deleted.
- [ ] No other package's call-mismatch row count goes up.
