---
title: "msgpack parity: the Ruby oracle harness, NDJSON in and packed bytes out"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: rig
packages: ["msgpack"]
deps: ["msgpack-parity-value-spec-and-builders"]
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/msgpack/parity/oracle.rb` is the gem side of the rig. It reads
value-specs as NDJSON on stdin and writes one NDJSON result per line: the
value built by the Ruby builder, packed by the gem, as base64; plus a canonical
description of the value for the load-direction comparison.

It runs against the gem pinned to the version `vendor/sources.lock.json`
records — `msgpack 1.8.0`, which matches `vendor/msgpack/v1.8.0/` exactly. Both
`1.8.3` and `1.8.0` are installed locally, so an unpinned `require` picks the
wrong one silently.

The Ruby builder is the mirror of `build.ts` and shares its contract: a spec
names a Ruby type, so `{"t":"float","v":"1.0"}` builds `1.0` and
`{"t":"int","v":"1"}` builds `1`.

## Acceptance criteria

- [ ] `oracle.rb` reads NDJSON specs on stdin, writes NDJSON results on stdout,
      one per input line, in order, and never buffers the whole input.
- [ ] It activates `msgpack` at exactly `1.8.0` via `gem "msgpack", "= 1.8.0"`
      and aborts with a clear message naming the found version on a mismatch.
- [ ] A Ruby builder covering the same 9 native families as `build.ts`, reading
      `enc` and hex `bytes` for strings.
- [ ] Each result carries the packed bytes as base64 and a canonical
      description of the built value.
- [ ] A malformed or unbuildable spec yields a result row carrying the error,
      not a crash that loses the rest of the batch.
- [ ] The default factory used for packing is stated explicitly in the result,
      so a native-family run and an ext-registry run are distinguishable.

## Definition of done

Shelling out once per case does not close this story; the oracle is one
long-lived process reading a stream.

## Verification

```bash
echo '{"t":"int","v":"-1"}' | ruby packages/msgpack/parity/oracle.rb
```

## Notes

`vendor/msgpack/v1.8.0/spec/spec_helper.rb` shows the gem's own activation
shape. The gem's whole conformance corpus is `spec/cases.json` (220 bytes) and
`spec/cases.msg` (213 bytes) — worth running through the oracle as a first
smoke test, since the expected values are already known.
