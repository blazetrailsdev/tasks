---
title: "assign_parameters' :json arm encodes with JSON.stringify, not ActiveSupport::JSON.encode"
status: draft
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assign_parameters`' `:json` arm
(`vendor/rails/actionpack/lib/action_controller/test_case.rb:123`) encodes the
body with Rails' own encoder:

```ruby
when :json
  data = ActiveSupport::JSON.encode(non_path_parameters)
```

`packages/actionpack/src/action-controller/test-case.ts:501-506` uses
`JSON.stringify(nonPathParameters)` instead. The two differ in ways a
controller test can observe:

- `ActiveSupport::JSON.encode` routes every node through `as_json`
  (`vendor/rails/activesupport/lib/active_support/json/encoding.rb`), so a
  `Time`, `Date`, `BigDecimal`, `HashWithIndifferentAccess` or model in the
  params encodes by its Rails rules; `JSON.stringify` reaches only `toJSON`.
- It escapes HTML entities by default
  (`Encoding.escape_html_entities_in_json`), which `JSON.stringify` does not.

trails already has the encoder: `Encoding.encode`
(`packages/activesupport/src/json/encoding.ts:19,76`) over `JSONGemEncoder`
(`:12`), the port of `ActiveSupport::JSON::Encoding`. So this is a call-site
flip, not a new port.

Surfaced in #7556 while converging the surrounding four-arm `case` (the `nil`
raise and `:xml`'s `to_xml`); the `:json` arm predates that PR and was left
untouched to keep the change scoped to the arms the story named.

## Converged shape

```ts
case ":json":
  data = new Encoding.jsonEncoder({}).encode(nonPathParameters);
```

spelled however `ActiveSupport::JSON.encode`'s own delegation
(`activesupport/lib/active_support/json/encoding.rb:22-25` —
`Encoding.json_encoder.new(options).encode(value)`) is already ported at its
other call sites; reuse that spelling rather than inventing a second one.

## Acceptance criteria

- [ ] The `:json` arm encodes through ActiveSupport's JSON encoder, not
      `JSON.stringify`.
- [ ] A test covers a params value whose `as_json` differs from its
      `JSON.stringify` output (a `Time` or a `BigDecimal`).
- [ ] `pnpm parity:api:calls` green — the `encode` call Rails makes is no
      longer omitted.
