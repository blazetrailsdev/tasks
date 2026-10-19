---
title: "Drop Encryptor's serializer === JSON byte-form arm (encryptor.rb:170-189)"
status: blocked
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps:
  - marshal-dump-answers-binary-string-seat
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-19T22:17:58Z"
assignee: "rack-session-encryptor-drop-json-byte-form-arm"
blocked-by: "needs marshal-dump-answers-binary-string-seat: Marshal.dump output is byte-form, JSON.dump is UTF-16; with no encoding tag serializePayload cannot interpolate both into bytes without the serializer test"
closed-reason: null
---

## Context

`packages/rack-session/src/encryptor.ts` (trails#9087) `serializePayload` and `deserializedMessage` carry a `this.serializer === JSON` arm that Rails does not have (`vendor/rack-session/v2.1.0/lib/rack/session/encryptor.rb:170-189`): under `serialize_json`, the dump is converted with `b()` before interpolation and the sliced bytes are re-read with `forceEncoding(..., "UTF-8")` before `JSON.load`. It exists because the port holds binary data as one-code-unit-per-byte JS strings, and Marshal output is already in that form while `JSON.dump` output is not. Ruby gets this for free: interpolation concatenates bytes, and `JSON.load` runs `convert_encoding` (`vendor/ruby/v3.3.11/ext/json/parser/parser.rl:673-687`) over a binary String.

## Converged shape

No serializer test in either method. Either (a) the encryptor's binary data rides ruby-compat's binary-String seat (`Uint8Array`), which `JSON.parse` already decodes as UTF-8 (`packages/ruby-compat/src/json.ts:95-101`) and `Marshal.load` accepts, with `JSON.load` taking the same `Uint8Array` arm; or (b) ruby-compat `JSON.load` applies `convert_encoding` to a byte-form string. Pick whichever keeps `serialize_payload` / `deserialized_message` line-for-line with encryptor.rb.

## Acceptance criteria

- [ ] `encryptor.ts` has no `serializer === JSON` arm.
- [ ] `encryptor.trails.test.ts` "round-trips non-ASCII under serialize_json" still passes.
- [ ] `parity:api:calls` / `:calls:args` stay green for encryptor.rb.
