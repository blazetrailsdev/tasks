---
title: "ruby-compat Marshal.dump answers ASCII-8BIT bytes (Uint8Array)"
status: draft
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Marshal.dump` returns an ASCII-8BIT String (`vendor/ruby/v3.3.11/marshal.c` `rb_marshal_dump_limited`, `w_byte` into a binary buffer). ruby-compat's `Marshal.dump` (`packages/ruby-compat/src/marshal.ts`) instead answers a JS string with one code unit per byte. ruby-compat's binary seat is `Uint8Array` (`string/force-encoding.ts` `rbObjEncoding`).

This blocks `rack-session-encryptor-drop-json-byte-form-arm`. `packages/rack-session/src/encryptor.ts` `serializePayload` / `deserializedMessage` keep a `serializer === JSON` arm that `encryptor.rb:170-189` does not have. The arm is there because Marshal output is byte-form and `JSON.dump` output is not. There are about 75 `Marshal.dump(` call sites, test files included.

## Acceptance criteria

- [ ] `Marshal.dump` answers a `Uint8Array` (ASCII-8BIT), and `Marshal.load` accepts one.
- [ ] Every caller is converged so that the encryptor can carry its payload as bytes. That lets `rack-session-encryptor-drop-json-byte-form-arm` drop its arm.
