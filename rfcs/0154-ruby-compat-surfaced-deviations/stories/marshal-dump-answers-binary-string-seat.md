---
title: "marshal-dump-answers-binary-string-seat"
status: done
updated: 2026-10-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9191
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Marshal.dump` (`packages/ruby-compat/src/marshal.ts:1572`) answers an ASCII-8BIT String as a one-char-per-byte JS string, while `JSON.dump` answers a UTF-16 JS string. A JS string carries no encoding tag, so a body that interpolates either dump into bytes (`Rack::Session::Encryptor#serialize_payload`, `vendor/rack-session/v2.1.0/lib/rack/session/encryptor.rb:168-177`) cannot tell the two apart and has to test which serializer produced it (`packages/rack-session/src/encryptor.ts` `serializePayload` / `deserializedMessage`). Ruby concatenates bytes by encoding tag (`rb_str_buf_append`).

## Acceptance criteria

- [ ] `Marshal.dump` answers the binary-String seat (`Uint8Array`), as `b()` and `Marshal.load` already accept; its ~79 call sites converge.
- [ ] `JSON.load` takes a `Uint8Array` source as `JSON.parse` does (`convert_encoding`, `vendor/ruby/v3.3.11/ext/json/parser/parser.rl:673-687`).
- [ ] Unblocks `rack-session-encryptor-drop-json-byte-form-arm`.
