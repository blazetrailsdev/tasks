---
title: "converge-hash-default-proc-seats"
status: in-progress
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 33
pr: 7321
claim: "2026-09-01T00:46:36Z"
assignee: "retire-no-js-call-form-entries-and-fetch-receipts"
blocked-by: null
closed-reason: null
---

## Context

Found by `pnpm parity:structural-duplicates:report` (RFC 0129,
`structural-duplicate-detector-report`), and only visible once the report was
fixed to read class and module members — the first run read top-level functions
only and missed all 43,591 members.

Two classes carry their own `default_proc` seat instead of inheriting
ruby-compat's `Hash`:

- `packages/activesupport/src/hash-with-indifferent-access.ts:155` `defaultProc`
- `packages/rack/src/headers.ts:115` `defaultProc`

Both match the shape of `packages/ruby-compat/src/hash.ts` `Hash#defaultProc`,
the port of `rb_hash_default_proc` (`vendor/ruby/hash.c:2285`), and both carry
the paired `default`/`default_proc=` mutual-clearing behaviour beside it.

In Ruby both hosts subclass `Hash` and inherit the seat for free
(`HashWithIndifferentAccess < Hash`, `Rack::Headers < Hash`). trails cannot
inherit it because each class already extends something else, which is why each
grew its own copy — the activesupport one says so in a standing
`@noRailsEquivalent PERMANENT — inherited from Ruby's Hash, which this class
subclasses` receipt.

That receipt explains the copy; it does not make it not a copy. This story is to
decide and record which it is: either both hosts converge onto ruby-compat's
`Hash` seat (a shared mixin or delegation), or the receipt is re-stated as the
final answer with the reason spelled out at both sites rather than one. It is
filed rather than fixed in the detector PR because it is a value-type change,
not a report change.

## Acceptance criteria

- A decision, recorded at both call sites: converge onto ruby-compat's `Hash`
  seat, or a receipt naming the language shortcoming that forces the copy.
- If converged: `defaultProc`, `default` and their mutual-clearing writes come
  from one place, and `pnpm parity:structural-duplicates:report` no longer lists
  a `defaultProc` candidate.
- `pnpm parity:api:extra:gate` unchanged or tightened; no baseline widened.
