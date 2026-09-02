---
title: "Capture Hash keys from the paren-less `CONST.update` command form"
status: draft
updated: 2026-09-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`maybe_record_hash_const_update` (`scripts/api-compare/extract-ruby-api.rb`,
added by PR #7351 for RFC 0126) records the keys a Hash constant gains through
`CONST.update(...)` / `CONST.merge!(...)`, so a faithful TS port of such a key
has a Ruby key to be credited against. It reads its argument list off
`node[2]` as an `arg_paren`, so it only sees the PARENTHESISED form.

Ruby's paren-less command form reaches Ripper as a `:command_call` — the same
split `extract-ruby-api-misses-paren-less-struct-new-command-form` describes for
`CONST = Struct.new :a, :b` — with the bare hash sitting directly in
`args_add_block`, never in an `arg_paren`. So

```ruby
PARSING.update "double" => PARSING["float"]
```

records nothing, while its parenthesised twin
(`vendor/rails/activesupport/lib/active_support/xml_mini.rb:90-93`) records
both keys.

Latent today — the live instance in `xml_mini.rb:90-93` is parenthesised, and
`file_hash_keys["xml_mini.rb"]` does contain `double` — but it is the same hole
the parent story closed, one syntax form over, and the next Hash constant that
gains its keys through a paren-less `update` will surface a faithful port as
novel surface.

## Converged shape

Recognise the `:command_call` shape in `walk` beside the existing
`:method_add_arg` arm, and factor the receiver/method check out of
`maybe_record_hash_const_update` so both forms share it. Keep every other
constraint exactly as it is: the receiver must still resolve through
`hash_constant?` to a Hash constant THIS file assigns, only `update` / `merge!`
count, and a computed key is still skipped while its literal siblings are
recorded. `literal_hash_keys` already accepts the `bare_assoc_hash` node the
command form produces, so no change is needed there.

Do NOT widen this to every `x.update(...)` call site.

## Acceptance criteria

- A paren-less `PARSING.update "double" => PARSING["float"]` on a Hash constant
  the file assigns records `double` — unit test in
  `scripts/api-compare/extract-ruby-api.test.ts` beside the three added by
  #7351.
- A paren-less `update` on a constant that is not a recorded Hash constant of
  that file records nothing — unit test.
- A computed key in the paren-less form is skipped while its literal siblings
  are recorded — unit test.
- No package's `pnpm parity:api:extra` novel count rises.
