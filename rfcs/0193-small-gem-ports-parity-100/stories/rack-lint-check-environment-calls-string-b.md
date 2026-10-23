---
title: "Rack::Lint check_environment calls value.b for the non-ASCII check"
status: ready
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Lint::Wrapper#check_environment` (`vendor/rack/v3.1.14/lib/rack/lint.rb:320-329`):

```ruby
next if value.encoding == Encoding::ASCII_8BIT
unless value.b !~ /[\x80-\xff]/n
  raise LintError, "env variable #{key} has value containing non-ASCII characters and has non-ASCII-8BIT encoding #{value.inspect} encoding: #{value.encoding}"
```

`packages/rack/src/lint.ts` (`checkEnvironment`, the `Object.entries(env)` loop) has the
`Uint8Array` skip for the ASCII-8BIT arm. It then tests `/[\u0080-￿]/` on the raw string,
where Rails tests `/[\x80-\xff]/n` on `value.b`. ruby-compat's `b`
(`packages/ruby-compat/src/string/b.ts`) is already the port of `String#b`, so the call is
dropped, and the regex is a hand-rolled stand-in for it.

The upshot: a string already in ruby-compat's ASCII-8BIT byte form (every code unit below
0x100, as `b("ሴ")` returns) is rejected. Rails accepts `"ሴ".b`
(`vendor/rack/v3.1.14/test/spec_lint.rb:237-239`), and the PR #9187 port had to spell it as
a `Uint8Array` instead.

## Acceptance criteria

- [ ] The non-ASCII arm is `/[\x80-\xff]/.test(b(value))`, calling ruby-compat's `b` as Rails calls `value.b`.
- [ ] Decide, citing ruby-compat's byte-form convention, whether a string in that byte form
      counts as ASCII-8BIT for the `next if` arm. If it does, `spec_lint.rb:237-239`
      ports with `b("ሴ")` in `lint.test.ts`.
- [ ] `pnpm parity:api:calls` stays green.
