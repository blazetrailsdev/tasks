---
title: "tooling: the call-argument comparer still compares a Ruby string's source text, not its value"
status: ready
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8420 made the literal comparer decode a Ruby string literal before comparing it
(`decodeRubyString`, `scripts/api-compare/literals.ts`), using the literal's opening token, which the
Ruby extractor records as `opener` for defaults and constants.

The call-ARGUMENT comparer has the same fault and was left as it was. A Ruby `str:` descriptor is still
the undecoded source text (`extract-ruby-api.rb`, the `"str:#{escape_descriptor_text(...)}"` arm),
the TS descriptor is `expr.text`, already decoded, and `call-args.ts` bridges them with
`foldSourceEscapes`, a regex over `\e`, `\033`, `\x1b`, `\0`, `\r`, `\n`, `\t` only. So:

- a Ruby argument `"\\"` compares as two backslashes against the port's one, a false shape row;
- a Ruby `"\\n"` (backslash, n) folds onto a real newline, a false match;
- a single-quoted `'\n'` folds onto a newline as well.

`call-arg-mismatches.json` carries no backslash-bearing row today, so nothing is red; this is latent.

## Acceptance criteria

- [ ] The Ruby extractor emits a call-argument string descriptor that carries its decoded value, or its opener, so `call-args.ts` can decode it through `decodeRubyString`; `foldSourceEscapes` is deleted.
- [ ] Unit tests cover `"\\"`, `"\\n"`, `'\n'` and `"\e[0m"` as call arguments.
- [ ] `pnpm parity:api:calls:args` stays green; any baseline row that goes stale is deleted by hand, with no reseed.

## Verification

```bash
pnpm vitest run scripts/api-compare && pnpm parity:api:calls:args
```
