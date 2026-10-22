---
title: "marshal-dump-answers-binary-bytes"
status: done
updated: 2026-10-22
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

`rack-session-encryptor-binary-strings-as-bytes` wants `Rack::Session::Encryptor`
(`vendor/rack-session/v2.1.0/lib/rack/session/encryptor.rb:168-189`) to hold its
payload as `Uint8Array` and drop the `serializer === JSON` arm. That cannot land
while ruby-compat's `Marshal.dump` (`packages/ruby-compat/src/marshal.ts:1572`)
answers BINARY as a latin1 JS string, one char per byte: once
`"#{[padding_bytes].pack('v')}#{padding_data}#{serialized_data}"` is bytes,
`serialized_data` must become bytes too, and a UTF-8 conversion corrupts a
Marshal dump (length bytes >= 0x80), while a latin1 conversion mangles JSON.dump's
non-ASCII output. Ruby avoids this through the String encoding tag
(CLAUDE.md § "A String has no encoding tag either").

## Acceptance criteria

- [ ] `Marshal.dump` answers a `Uint8Array` (BINARY), and `Marshal.load` accepts one
      (`vendor/ruby/v3.3.11/marshal.c:1207`, `:2434`); every caller in the repo is updated.
- [ ] `JSON.load` accepts a `Uint8Array` as `JSON.parse` does (`packages/ruby-compat/src/json.ts:95-101`).
- [ ] `rack-session-encryptor-binary-strings-as-bytes` is unblocked.
