---
title: "msgpack parity: the SerializerWithFallback latin1 seam and detectFormat sniff order"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
cluster: serializer
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Two things in
`packages/activesupport/src/messages/serializer-with-fallback.ts` look like
divergence candidates and are cheap to settle, so they get their own story
rather than riding along with the generators.

**The latin1 seam.** Line 100 is:

```ts
return MARSHAL_SIGNATURE + Buffer.from(coder.dump(object), "utf8").toString("latin1");
```

inverted at line 104. Marshal output is binary, so encoding it as UTF-8 and
reading it back as latin1 looks lossy for any byte at or above 0x80. The
msgpack arm at lines 153-158 does the same latin1 conversion without the UTF-8
step. This may be sound — `coder.dump` may already answer a latin1-ranged
string — but it has not been verified either way, and the fix if it is wrong is
a data-corruption fix.

**The sniff order.** `detectFormat` (line 68) tries msgpack, then marshal, then
JSON, and returns the first that claims the payload. A payload satisfying two
sniffs resolves by position, which is a small bounded search.

## Acceptance criteria

- [ ] The latin1 round trip is settled with evidence either way: a test showing
      a payload containing bytes at or above 0x80 survives
      `dump` then `_load` for each of the three arms, or a reproduction showing
      it does not.
- [ ] If it does not survive, the finding is filed as its own story against
      activesupport with the minimal reproduction, and this story records the
      pointer. The fix is out of scope here.
- [ ] A search for payloads claimed by more than one of the three `dumped`
      predicates, with any found case recorded as a corpus case pinning the
      documented resolution order.
- [ ] `detectFormat`'s order asserted explicitly, so a reorder is a test
      failure rather than a silent behaviour change.

## Definition of done

Concluding the seam "looks fine" without a test that would catch the lossy case
does not close this story.

## Verification

```bash
pnpm vitest run packages/activesupport/src/messages/serializer-with-fallback.trails.test.ts
```
