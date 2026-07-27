---
title: "Fix 6.25%-per-run tamper collision flake in codec.trails.test.ts"
status: ready
updated: 2026-07-27
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/messages/codec.trails.test.ts` tampers with a signed
message by rewriting its final character to `"0"`
(`message.slice(0, -1) + "0"`). The final segment is hex-encoded, so its last
character is uniform over the 16 hex digits; when it is already `"0"` the
"tampered" message is byte-for-byte the original, the round trip succeeds, and
the `toThrow` assertion fails.

Measured over 20,000 encrypt/tamper cycles with `SECRET = "x".repeat(32)`:

```text
no-throw: 1247 / 20000 = 6.235%
last-char distribution: {"0":1247,"1":1238,"2":1243,"3":1304,"4":1277,"5":1218,
                         "6":1226,"7":1244,"8":1273,"9":1272,"a":1252,"b":1259,
                         "c":1256,"d":1278,"e":1246,"f":1167}
```

The no-throw count equals the `"0"` bucket exactly — the outcome is decided
solely by the random IV's last hex nibble.

Real CI failure:
<https://github.com/blazetrailsdev/trails/actions/runs/30222596514/job/89847482424>

Both tests use the pattern:

- `codec.trails.test.ts:74-82` `verify raises InvalidSignature on a tampered message`
  (three occurrences, `MessageVerifier`)
- `codec.trails.test.ts:84-90` `decryptAndVerify raises InvalidMessage on a tampered message`

Rails does not poke a single character; it uses a `munge` helper
(`vendor/rails/activesupport/test/message_encryptor_test.rb:191-195`) that
base64-decodes a segment, reverses the bytes, and re-encodes — used at
`:38-40` and `:46-48`. Reversing cannot reproduce the original except for a
palindromic byte string.

## Acceptance criteria

- A `munge`-equivalent helper mirroring Rails' `munge` replaces
  `message.slice(0, -1) + "0"` in both tests.
- Test names are unchanged (`.trails.test.ts` names are `test:compare` keys).
- 20,000-iteration measurement shows 0 no-throws with the fix (throwaway
  measurement deleted before commit).
- `pnpm vitest run packages/activesupport/src/messages/`, `pnpm typecheck`,
  `pnpm lint` pass.
- No changes outside `packages/activesupport/`.
