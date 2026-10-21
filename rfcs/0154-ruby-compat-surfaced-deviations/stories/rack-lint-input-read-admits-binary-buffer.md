---
title: "Rack::Lint InputWrapper#read admits a binary (Uint8Array) buffer"
status: draft
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
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

`Rack::Lint::Wrapper::InputWrapper#read` checks its buffer with
`unless args[1].kind_of?(String)` (vendor/rack/v3.1.14/lib/rack/lint.rb:491).
Under the ASCII-8BIT ruling (CLAUDE.md § "A String has no encoding tag either"),
a binary Ruby String is a `Uint8Array` in trails. But
`packages/rack/src/lint.ts:82` accepts only `typeof args[1] === "string"`, so it
raises `LintError("rack.input#read called with non-String buffer")` for a binary
buffer. That buffer is exactly what `Marcel::Magic.magic_match` passes:
`"".encode(Encoding::BINARY)`, vendor/marcel/v1.0.4/lib/marcel/magic.rb:121,
`packages/marcel/src/magic.ts` `magicMatch`. This surfaced on trails#9198. The
return-value check on line 87 already admits `Uint8Array`.

## Acceptance criteria

- `InputWrapper#read`'s buffer guard admits a string or a `Uint8Array`, the two
  trails spellings of a Ruby String, mirroring lint.rb:491.
- A rack lint test reads with a binary (`Uint8Array`) buffer and does not raise.
