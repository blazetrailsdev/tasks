---
title: "Port Mail::Encodings RFC 2047 value encoding and the charset half of Mail::Utilities"
status: in-progress
updated: 2026-10-30
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: ["mail"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9504
claim: "2026-10-30T19:16:43Z"
assignee: "rake-rules-test-port"
blocked-by: null
closed-reason: null
---

## Context

`mail-rfc2047-encodings-and-utilities-remainder` ported the string-only
`Mail::Utilities` members (`atom_safe?` .. `map_with_index`, `blank?`,
`escape_paren` / `paren`, `escape_bracket` / `bracket`, `uri_parser`) and
`spec/mail/utilities_spec.rb` into `packages/mail/src/utilities.ts` /
`utilities.test.ts`, plus `ATOM_UNSAFE` / `PHRASE_UNSAFE` / `TOKEN_UNSAFE`
in `constants.ts`. Left, all charset-dependent:

- `vendor/mail/2.8.1/lib/mail/encodings.rb:53-312`: `transcode_charset`,
  `param_encode` / `param_decode`, `decode_encode`, `value_decode`,
  `unquote_and_convert_to`, `address_encode`, `encode_non_usascii`,
  `b_value_encode` / `q_value_encode`, `b_value_decode` / `q_value_decode`,
  `value_encoding_from_string`, `collapse_adjacent_encodings`,
  `each_base64_chunk_byterange`, `each_chunk_byterange`. Needs constants
  `ENCODED_VALUE`, `FULL_ENCODED_VALUE`, `Q_VALUES`, `B_VALUES`, `EMPTY`
  (`constants.rb:37-77`).
- `vendor/mail/2.8.1/lib/mail/utilities.rb`: `generate_message_id` (`:298`,
  needs `Mail.random_tag`), `StrictCharsetEncoder` / `BestEffortCharsetEncoder`
  / `charset_encoder` (`:302-338`), `transcode_charset` (`:384`),
  `encode_utf7` / `decode_utf7` (`:391-411`), `b_value_encode` / `_decode`,
  `q_value_encode` / `_decode`, `param_decode` / `param_encode` (`:413-472`),
  `pick_encoding` (`:484-543`), `string_byteslice` (`:545`; ruby-compat
  `byteslice` takes only a `Uint8Array`), private `convert_to_encoding` /
  `transcode_to_scrubbed_utf8`.
- Non-UTF-8 charsets: ruby-compat `encode` knows UTF-8, US-ASCII, ASCII-8BIT,
  ISO-8859-1 only; no new runtime deps, so decode through `TextDecoder`
  labels or a ruby-compat converter story first.
- `utilities_spec.rb`'s `mb_chars` tests wait on `Mail::Multibyte`.

## Acceptance criteria

- Members above ported at their Ruby names into `encodings.ts` /
  `utilities.ts`.
- `spec/mail/encodings_spec.rb` ported to `packages/mail/src/encodings.test.ts`
  with verbatim names (split across PRs if over the ceiling).
