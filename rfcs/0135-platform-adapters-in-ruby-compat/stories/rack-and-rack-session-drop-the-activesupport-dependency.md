---
title: "rack and rack-session drop the activesupport dependency — the acceptance test for RFC 0135"
status: draft
updated: 2026-09-02
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["rack", "rack-session"]
deps: ["flip-file-dir-call-sites-rack", "move-crypto-adapter-into-ruby-compat", "move-os-http-child-process-and-async-context-adapters"]
deps-rfc: []
est-loc: 200
priority: 15
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The acceptance test for RFC 0135. `packages/rack/package.json` and
`packages/rack-session/package.json` both declare
`"@blazetrails/activesupport": "workspace:*"`. **The Ruby `rack` gem has no
runtime dependencies at all**, so this is a fidelity deviation with nothing
tracking it — which is where this RFC started.

By the time this story runs, everything rack imports from activesupport should
be gone. The 2026-09-02 census of what it was:

- Adapter symbols, moved by the relocation stories — `getFs` (5 files),
  `getPath` (5), `getCrypto` (2), `FsStatResult`, `cwd`, `platform`, `stderr`,
  `HttpRequest` / `HttpResponse` / `HttpServer` / `getHttpAsync`.
- Symbols where activesupport is already only a re-export shim over ruby-compat
  — `StringIO` (8 uses; `activesupport/src/string-io.ts` is a one-line
  re-export), `include` (2), `ArgumentError` (2), `KeyError` (1).
- Two that are neither: `inspect` (`core-ext/object/inspect.ts`) and `valuesAt`
  (`hash-utils.ts`). **These are the residue this story has to actually
  decide.** `Object#inspect` is Ruby, not Rails, and RFC 0129 has
  `move-object-inspect-and-to-s-to-ruby-compat` (status `ready`) for it —
  dep on it rather than duplicating. `Array#values_at` is Ruby core with no
  ruby-compat seat yet; file it or land it, but do not leave rack importing
  activesupport for one function.

Verify with the built output, not `src/`: a workspace dependency is only
visible transitively there. `scripts/ruby-compat-leaf.ts` already does exactly
this check for ruby-compat and is the model.

## Acceptance criteria

- Neither `package.json` declares `@blazetrails/activesupport`, in
  `dependencies` or `peerDependencies`.
- No file under `packages/rack/src` or `packages/rack-session/src` imports from
  `@blazetrails/activesupport` or any of its subpaths.
- `pnpm build`, `pnpm typecheck` and both packages' test suites green.
- A guard asserts it, in the shape of `scripts/ruby-compat-leaf.ts`, so the edge
  cannot come back silently the way it arrived.
