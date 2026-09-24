---
title: "ruby-compat rule 1 (only what trails calls) has no mechanical gate: receipts bypass the extra-surface counter"
status: draft
updated: 2026-09-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/README.md` rule 1 ("Only what trails actually calls")
claimed `parity:api:extra:gate` enforces it. It cannot: rule 2 requires a
`@noRailsEquivalent PERMANENT` receipt on every export, and
`scripts/api-compare/extra-surface.ts:1834-1842` subtracts a receipted member
from BOTH `novel` and `total` before classification. So a correctly receipted
speculative member never reaches the counter. The gate enforces rule 2 (an
unreceipted member raises `total`), not rule 1. Established while working
`ruby-compat-extra-surface-growth-protocol`, whose premise ("receipting a moved
export still raises `total`") was falsified the same way: receipting
`StringIO#rewind` on main dropped the measured `total` from 52 to 51.

Measured on main at 171a758235 with a regex scan of
`packages/ruby-compat/src/index.ts`'s named value exports against every
`import { … } from "@blazetrails/ruby-compat[/…]"` under `packages/*/src`
(ruby-compat excluded) and `scripts/`: 217 exported, 33 with no importer:

BadURIError ConverterNotFoundError DEFAULT_PARSER DigestInstance EncodingError
FiberError HMAC HTTP InvalidByteSequenceError InvalidComponentError
LocalJumpError MatchData Method Monitor RFC3986_PARSER StringReceiver chdir
cmpint defineModule getAsyncContext initialize initializeIncludedModules
moduleVisibility onSignal pbkdf2Async rbBuiltinClassName
registerAsyncContextAdapter registerCryptoAdapter registerHttpAdapter
registerZlibAdapter reject stdin update

Some of these have a legitimate caller the scan cannot see: an internal one
(the README credits `rbEqual` to `ruby-compat/src/range.ts`), a namespace read
(`URI.HTTP`), a raise inside ruby-compat itself, or a test-setup file. So the
gate needs a precise definition of "call site" before it can count.

## Acceptance criteria

- A check, scoped to `ruby-compat` only, fails when a public export has no call
  site, with "call site" defined to include the internal-caller case the README
  already credits.
- It runs in CI (the `rails-comparison` job or wherever
  `parity:api:extra:gate` runs), and its initial exceptions for today's
  uncalled exports are an only-shrink register, not a permanent allowlist —
  each one is either given its caller, deleted, or shown to be called.
- `packages/ruby-compat/README.md` rule 1 names the check as its enforcement.
