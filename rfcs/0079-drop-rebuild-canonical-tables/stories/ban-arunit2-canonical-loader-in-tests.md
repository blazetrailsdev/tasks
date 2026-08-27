---
title: "ban-arunit2-canonical-loader-in-tests"
status: ready
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
packages: []
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

PR #7118 added `loadCanonicalArunit2Schema` to
`packages/activerecord/src/support/canonical-schema.ts` — the arunit2 half of
`schema.rb:1444-1460`, the four tables `loadCanonicalSchema` deliberately skips
because Rails creates them through `Course`/`College`/`Professor.lease_connection`.
Its only caller is `support/setup-second-pool.ts`, trails' stand-in for the
`db:create` step Rails runs in front of `schema.rb`.

It is NOT in the `BANNED` set of `eslint/no-internal-canonical-loaders.mjs`
(`eslint/no-internal-canonical-loaders.mjs:53`), which currently holds
`ensureCanonicalTables`, `loadCanonicalSchema` and `loadSchema`. That rule
exists so a `*.test.ts` cannot reach past `fixtures({ ... })` into the
lower-level canonical loaders — and its own comment records why `loadSchema`
had to be added: "banning only the wrapped symbol would leave the same
schema-wiring backdoor open under a different name." The new export is exactly
that shape: a second entry point into the canonical registry, sitting in the
same module as an already-banned one.

Nothing exploits it today — no test file imports it — so this is a latent hole,
not a live bug. But the whole point of the rule is that the backdoor is closed
before someone walks through it.

## Converged shape

Add `"loadCanonicalArunit2Schema"` to `BANNED` in
`eslint/no-internal-canonical-loaders.mjs`, and cover it in
`eslint/no-internal-canonical-loaders.test.mjs` alongside the existing
`loadCanonicalSchema` invalid case. `support/setup-second-pool.ts` is not a
`*.test.ts` and so is already out of the rule's scope — no allowlist entry is
needed.

While there, check whether the BANNED set should be derived from the loader
modules' exports rather than hand-listed, which is what let this one slip in.

## Acceptance criteria

- A `*.test.ts` importing `loadCanonicalArunit2Schema` from
  `support/canonical-schema.js` reports.
- `support/setup-second-pool.ts` stays green.
- `eslint/no-internal-canonical-loaders.test.mjs` covers the new symbol.
