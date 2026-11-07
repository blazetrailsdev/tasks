---
title: "crass: port Crass::Scanner and read it from @s, as tokenizer.rb does"
status: draft
updated: 2026-11-07
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: ["html-sanitizer"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails#9825 scores crass in `parity:api`. `packages/html-sanitizer/src/crass/tokenizer.ts` is not shaped like `vendor/crass/v1.0.6/lib/crass/tokenizer.rb`:

- `initialize` builds one `Crass::Scanner` into `@s` (tokenizer.rb:62-65). The port opens a ruby-compat `StringScanner` inside each `tokenize` call and passes it to `consumeBadUrl(s)`, `consumeEscaped(s)` and `consumeUrl(s)` as an argument.
- `Crass::Scanner#peek(length = 1)` (scanner.rb) has a default. The port's `StringScanner#peek` takes the length explicitly, and `consume_bad_url`'s `valid_escape?(@s.peek(2))` is folded into a one-character look-ahead.
- `consume_url` builds its `:url` / `:bad_url` token with `create_token` (tokenizer.rb:559-575). The port returns `{ value, error }` and lets its caller build the token.

Each of these call sites carries a `@missingRailsCall` / `@missingRailsArgs CONVERGEABLE crass-tokenizer-reads-a-crass-scanner` receipt.

## Acceptance criteria

- [ ] `packages/html-sanitizer/src/crass/scanner.ts` ports `Crass::Scanner`, including `peek(length = 1)`.
- [ ] The tokenizer keeps it in `this.s` from its constructor, and its helpers read it rather than taking it as an argument.
- [ ] `consumeUrl` returns the token it builds with `createToken`.
- [ ] The receipts naming this story are deleted, and `pnpm parity:api:calls` and `parity:api:calls:args` stay green.
