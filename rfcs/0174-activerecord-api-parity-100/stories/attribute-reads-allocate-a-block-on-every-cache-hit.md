---
title: "activemodel: every attribute read allocates a block, reads are 7x slower than at 9e17ddc98d"
status: done
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: trails#8540
claim: "2026-10-05T16:28:21Z"
assignee: "attribute-reads-allocate-a-block-on-every-cache-hit"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap re-vendoring from trails `9e17ddc98d` to `5ee5760880` (trails#8472) to pick up
the record-load fix. Loading got faster and every attribute read got about seven times slower, so
the application came out no faster.

Measured on trailmap's `Story` (11,531 rows, SQLite), alternating the two pins twice:

|                                         | `9e17ddc98d` | `5ee5760880` |
| --------------------------------------- | ------------ | ------------ |
| `Story.all().toArray()`                 | 1.01-1.14 s  | 0.60-0.64 s  |
| 115,310 reads of `story.id`             | 17-23 ms     | 141-197 ms   |
| 115,310 reads of `story.priority`       | 14-15 ms     | 114-152 ms   |
| sort 11,531 records by `(priority, id)` | 69-93 ms     | 444-603 ms   |
| serialize all (about 20 reads a record) | 126-182 ms   | 305-381 ms   |

A CPU profile of the read loop at `5ee5760880` puts the self time in the block machinery, not in
casting: `block` (`packages/ruby-compat/src/hash.ts:23`) 25%, the iteration guard's `busy` setter
21%, `readId` 9%, `ownMethod`, `fetch`, `hashAref` and `hasKey` (all `hash.ts`) 14% together.
`LazyAttributeSet#fetchValue` (`packages/activemodel/src/attribute-set/builder.ts:82-100`) calls
`fetch(this.castedValues, name, rbBlock(() => ...))` on every read, so a read that hits the cast
cache still allocates a closure and a block and runs `Hash#fetch`'s guard. The reads were routed
this way by trails#8456 (`lazy attribute hashes read through hashAref`), trails#8459 and
trails#8470 (`AttributeSet#fetch forwards to Hash#fetch`), which sit between the two pins.

Rails: `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb`
`LazyAttributeSet#fetch_value` is the same shape, `casted_values.fetch(name) { ... }`; a block
passed to `Hash#fetch` costs nothing in MRI when the key is present.

## Expected shape

A read of an attribute already cast costs what it did at `9e17ddc98d` (about 0.15 µs). The
control flow can stay Rails': the hit path must not allocate, e.g. `fetch` taking the block as a
plain function and testing the key before building anything.

## Acceptance criteria

- [ ] A benchmark in the repo: 100,000 repeated reads of a cast attribute on loaded records, at or under the `9e17ddc98d` figure.
- [ ] `Story.all()` load time does not regress from `5ee5760880`.
- [ ] `pnpm parity:api` and `pnpm test:compare` deltas are non-negative.
