---
rfc: "0138-ruby-compat-residual-convergence"
title: "The ruby-compat residual: the divergences left behind once the package and the platform adapters both landed"
status: active
created: 2026-09-06
updated: 2026-09-06
owner: "@deanmarano"
packages:
  - ruby-compat
  - activesupport
  - actionpack
  - actionview
clusters:
  - fidelity
related-rfcs:
  - "0129-ruby-compat"
  - "0135-platform-adapters-in-ruby-compat"
  - "0089-corelib-primitives"
  - "0088-date-gem-port"
priority: 3
---

# RFC 0138 — the ruby-compat residual

## Summary

Two RFCs built `@blazetrails/ruby-compat` and neither is about building it any
more.

RFC 0129 created the package: one home for the MRI core value types a Rails
body freely calls, anchored to vendored `ruby/ruby` and measured by the call
gates. It closed 164 stories doing it. RFC 0135 moved the seven platform
`*-adapter.ts` files in and gave them Ruby's names — `File`, `Dir`,
`FileUtils`, `Pathname`, `IO`, `Process` — turning `FsAdapter` from public API
into a backend contract. It closed 48.

What remains under each is no longer structural. It is the same kind of work in
both: **individual MRI-semantics divergences in surface that already exists and
already ships.** A story from 0129 (`include()` re-copies an already-included
module's members) and a story from 0135 (`lstatSync` is optional on the fs
backend, collapsing `Entry_#lstat`'s `dereference?` arms) are the same shape of
defect against the same package, and only their filing history separates them.

This RFC is that residual, in one place, so the tail is scheduled as one tail
rather than as two RFCs that each look nearly done and each keep growing.

## Motivation

### Both parents read as finished and neither is

At the time of writing, 0129 has 12 open against 164 done and 0135 has 7 open
against 48. Both are net-draining over the last fortnight — 0129 closed 165
against 151 filed, 0135 closed 49 against 52. Read as burndowns they are
healthy. Read as RFCs they are misleading: each is 96%-and-93%-done
respectively, has been for weeks, and neither can close, because each keeps
surfacing one more divergence in the surface it already shipped.

That is the expected behaviour of a **convergence tail**, not of a project. A
project ends when its structure is built. A tail ends when nothing is left to
find, and nothing tells you in advance when that is.

### The split between them stopped tracking anything

The 0129/0135 boundary was a real one while it described a move: 0129 owned the
core value types, 0135 owned relocating the platform adapters. Both moves have
landed. What the boundary describes now is only which RFC a story happened to
be filed against, and it cuts through work that belongs together — the
`OpenSSL::Digest` constant seat (0135) and the BOM-sniffing `IO` seats (0129)
are both "a Ruby constant in ruby-compat does not discriminate the arms its MRI
counterpart does".

### One tail can be finished; two tails get abandoned

Seventeen stories at roughly 2,900 LOC is a schedulable amount of work with a
visible end. The same seventeen split across two RFCs, each carrying a done
count in the hundreds, is work nobody picks up, because each RFC individually
looks like it needs one more push and neither ever gets it.

## Design

### What moves

All open work from both parents, with one deliberate exception below. `done`
and `closed` stories stay where they are — the history of building the package
belongs to the RFCs that built it, and rehoming 212 closed stories would
destroy the record of what each accomplished.

The residual falls into three groups, and naming them is most of the value of
consolidating:

#### 1. MRI object-model and core semantics (ruby-compat proper)

- `include()` re-copies an already-included module's members
- `prepend()` ignores a module's per-instance initializer
- `initializeIncludedModules` is called only from `ActionController::Metal`
- `basicObjRespondTo` ignores the `pub` parameter it now accepts
- `Time#toTime`'s wall clock is up to 59s off for a sub-minute `utc_offset`
- `IO` read cannot BOM-sniff the UTF-16 and UTF-32 dummy seats
- `rb_io_modestr_fmode` drops the `bom|` prefix arm
- Port `URI::RFC2396_Parser#unescape`

#### 2. Platform backends (the 0135 surface, post-move)

- The Web Crypto adapter cannot serve digest, HMAC or cipher
- `OpenSSL::Digest` and `Digest` are one collapsed constant seat
- `FsAdapter.readFile` is optional, forcing a dead guard at every async call
  site
- `lstatSync` is optional, collapsing `Entry_#lstat`'s `dereference?` arms
- `Entry_#copy_file` is `copyFileSync`, dropping the source-mode create and
  `IO.copy_stream`
- The `ZlibAdapter` seam is one-shot, so `GzipWriter` buffers the payload
  (blocked — see below)

#### 3. Callers that are not ruby-compat at all

- `ActionView::Digestor` is an fnv1a stub that drops dependencies and never
  walks the template tree (400 LOC)
- Enroll `log_subscriber_test.rb`'s seven fragment-cache tests
- Converge the `Caching` include site onto `ActiveSupport::Configurable`
- Delete `AbstractController::Caching`'s pass-through wrappers around
  `Fragments`

Group 3 accumulated under 0129 because the `include`/`Configurable` work
touched those call sites, but none of it is a ruby-compat divergence — it is
ActionView and AbstractController fidelity. It is carried here so the
consolidation does not strand it, **not** because this is its right home. If an
actionview or actionpack fidelity RFC is the better owner, rehoming these four
out is a correct follow-up and should not wait for this RFC.

### What does not move

`copy-entry-hand-recurses-instead-of-entry-wrap-traverse` stays in 0135. It is
`in-progress` on PR #7580, and `post-merge-findings` infers an RFC from the
story it stamps; rehoming a story with an open PR risks misattributing the
merge. 0135 closes when that PR lands.

### The blocked story keeps its blocker verbatim

`zlib-seam-is-one-shot-so-gzipwriter-buffers-the-payload` carries a long,
specifically-verified blocker: no JS runtime offers a synchronous incremental
zlib API, `processChunkSync` unconditionally closes the handle, and the callers
(`SchemaCache.read`, `SchemaCache#open`) must stay sync to mirror Rails. Both
workarounds relocate or worsen the deviation, and the multi-member-gzip one
regresses byte-identity that `SchemaCache` depends on.

That blocker survives the move unedited. Consolidation must not become an
occasion to re-litigate a blocker somebody already did the work to establish;
unblocking it still requires making the `GzipReader`/`GzipWriter` callers async
first, which remains a separate, larger story.

### The parents are superseded, not closed

0129 and 0135 both become `superseded` with `superseded-by` pointing here, so
their closed stories and their prose stay reachable. Neither is `closed`: a
closed RFC reads as "this was finished", and the honest statement is "its
remaining work moved".

## Non-goals

- **Reopening what 0129 and 0135 decided.** The package exists, the adapters
  moved, the names are Ruby's. This RFC inherits those decisions.
- **Re-deriving the zlib blocker.**
- **Absorbing every future ruby-compat story.** New divergences file against
  whichever RFC owns the surface; this one owns a specific, enumerated
  residual and should shrink monotonically to zero.
- **Finding new work.** If this RFC's open count grows materially, that is a
  signal the tail was mis-scoped, not licence to widen it.

## Success

Seventeen stories, roughly 2,900 LOC, going to zero — and one RFC that can
actually be closed when they do.
