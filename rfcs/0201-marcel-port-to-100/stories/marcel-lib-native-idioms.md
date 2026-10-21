---
title: "Converge marcel's lib bodies to native, typed TypeScript"
status: ready
updated: 2026-10-21
rfc: "0201-marcel-port-to-100"
cluster: marcel-polish
packages: ["marcel"]
deps: ["marcel-drop-codegen-shims"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The generator lowers a call on a receiver it cannot type through inline
dispatch: `((x) => x instanceof globalThis.Set || x instanceof globalThis.Map
|| x instanceof Enumerator ? [...x] : Object.getPrototypeOf(x) ===
Object.prototype ? Object.entries(x) : x)(…)`, `rbStrSend(s, "get", new
Range(…))[0]` for a String slice, `rbEqual` on two Strings, and
`rbCheckArrayType` splats. Counts at `marcel-port` `3b165e0d11`: 21 in
`magic.ts`, 9 in `mime-type.ts`, 0 in `mime-type/definitions.ts` and
`marcel.ts`. `tables.ts` is data (4,815 lines) and is out of this story.

Each Ruby body in `vendor/marcel/v1.0.4/lib/marcel/{magic,mime_type}.rb` has a
known receiver type, so CLAUDE.md "Fidelity is the job" and "Ruby idioms that
do not translate literally" apply: the native form where the type is known
(`Object.entries`, `.slice`, `===`, `for … of`), the ruby-compat helper only
where its table says so. Names, parameter order and control flow stay the
Ruby ones.

## Acceptance criteria

- No inline dispatch lambda, `rbStrSend` slice or string `rbEqual` remains in
  `magic.ts` or `mime-type.ts` where the receiver's type is known; each kept
  helper is one CLAUDE.md's table keeps.
- Parameters and fields carry real types (`string`, `Pathname`, IO), not
  `unknown` or `{}`.
- Tests stay at 365 passing (or better).
- The PR body lists each generated pattern replaced, as generator feedback.
