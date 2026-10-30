---
title: "Port Mail::Encodings RFC 2047 value encoding and the rest of Mail::Utilities"
status: done
updated: 2026-10-30
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9481
claim: "2026-10-30T02:56:45Z"
assignee: "mail-rfc2047-encodings-and-utilities-remainder"
blocked-by: null
closed-reason: null
---

## Context

`mail-encodings-and-utilities` created `packages/mail` and ported the
transfer encodings (`vendor/mail/2.8.1/lib/mail/encodings/*.rb`), the
`Encodings` registry (`encodings.rb:20-51`) and the `Utilities` members those
call (`utilities.rb:224-226`, `:236-279`, `:378-387`), with
`encodings/*_spec.rb` ported and passing. The 800-LOC ceiling left the rest:

- `vendor/mail/2.8.1/lib/mail/encodings.rb:53-312`: `transcode_charset`,
  `param_encode` / `param_decode`, `decode_encode`, `value_decode`,
  `unquote_and_convert_to`, `address_encode`, `encode_non_usascii`,
  `b_value_encode` / `q_value_encode`, the private `b_value_decode` /
  `q_value_decode`, `value_encoding_from_string`,
  `collapse_adjacent_encodings`, `each_base64_chunk_byterange`,
  `each_chunk_byterange`. Needs `Mail::Constants`' `ENCODED_VALUE`,
  `FULL_ENCODED_VALUE`, `TOKEN_UNSAFE`, `Q_VALUES`, `B_VALUES`, `EMPTY`
  (`constants.rb:37-77`); `packages/mail/src/constants.ts` holds only four.
- The rest of `vendor/mail/2.8.1/lib/mail/utilities.rb`: `atom_safe?`,
  `quote_atom`, `quote_phrase`, `token_safe?`, `quote_token`, `dquote`,
  `unquote`, `unescape`, `paren` / `unparen`, `bracket` / `unbracket`,
  `escape_paren`, `uri_escape` / `uri_unescape` / `uri_parser`, `match_to_s`,
  `capitalize_field`, `constantize`, `dasherize`, `map_lines`,
  `map_with_index`, `blank?`, `generate_message_id`, `StrictCharsetEncoder`,
  `BestEffortCharsetEncoder`, `charset_encoder`, `escape_bracket`,
  `transcode_charset`, `encode_utf7` / `decode_utf7`, `b_value_encode` /
  `b_value_decode`, `q_value_encode` / `q_value_decode`, `param_decode` /
  `param_encode`, `pick_encoding`, `string_byteslice`, the private
  `convert_to_encoding` / `transcode_to_scrubbed_utf8`. Skip
  `has_constant?` / `get_constant` (CLAUDE.md "Constant lookup is an import or
  a registry").
- Non-UTF-8 charsets: ruby-compat's `encode`
  (`packages/ruby-compat/src/string/encode.ts`) knows only UTF-8, US-ASCII,
  ASCII-8BIT and ISO-8859-1, and the PR hard rules forbid a new runtime
  dependency, so `transcode_charset` / `pick_encoding` need `TextDecoder`
  labels or a ruby-compat converter story first.
- ruby-compat's `pack`/`unpack` `u`, `m`, `M` arms landed with the first PR
  (`packages/ruby-compat/src/array.ts`).

## Acceptance criteria

- The members above ported at their Ruby names into
  `packages/mail/src/encodings.ts` and `packages/mail/src/utilities.ts`.
- `spec/mail/encodings_spec.rb` and `spec/mail/utilities_spec.rb` ported to
  `packages/mail/src/encodings.test.ts` and `utilities.test.ts` with
  verbatim names. Split across two PRs if they exceed the ceiling.
