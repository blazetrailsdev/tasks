---
title: "no-node-builtins points at ruby-compat and File/Dir, retiring the ruby-compat carve-out"
status: in-progress
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: ["port-file-and-dir-classes-onto-the-fs-backend", "move-crypto-adapter-into-ruby-compat"]
deps-rfc: []
est-loc: 150
priority: 14
pr: 7467
claim: "2026-09-03T23:43:49Z"
assignee: "retarget-no-node-builtins-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`eslint/no-node-builtins.mjs:9-28` holds `ACTIVESUPPORT_REPLACEMENTS`, which
tells a developer importing `fs`, `path` or `crypto` to use `getFs()`,
`getPath()` or `getCrypto()` from `@blazetrails/activesupport`, and autofixes
both the import and every usage site to match.

After RFC 0135 that advice is wrong everywhere. The correct answer is
`@blazetrails/ruby-compat`, and for `fs`/`path` it is `File` / `Dir` rather than
an adapter accessor at all — so the message, the import target and the autofix's
rewrite shape all change together.

This also retires a wart `enforce-ruby-compat-leaf-and-browser-freedom` (#7383)
had to carve out: it notes the table "hard-codes `@blazetrails/activesupport` as
the fix … That is the wrong advice inside ruby-compat, which cannot import
activesupport", and required the rule to emit the plain `noNodeBuiltin` message
there instead of the `useAdapter` autofix, "or the autofix will write an import
that breaks the leaf rule it is meant to protect". Once the target is
ruby-compat, ruby-compat is no longer a special case and the carve-out goes.

The rule's `files` list (`eslint.config.mjs:213-250`) covers arel, activemodel,
activerecord, activesupport, rack, actionpack and actionview. Widening it is a
separate decision with its own evidence; this story retargets what the rule
already says.

## Acceptance criteria

- `ACTIVESUPPORT_REPLACEMENTS` is renamed for what it now names and points at
  `@blazetrails/ruby-compat`; `fs` → `File`, `path` → `File`, `crypto` →
  `getCrypto` (until the `SecureRandom` story re-dresses it).
- The autofix produces a call that type-checks — a fixture test per replacement,
  not just a message assertion.
- The ruby-compat carve-out from #7383 is deleted, and the PR body says so.
