---
title: "Ruby's Object#inspect / Object#to_s move to ruby-compat; present?/blank? stay in activesupport"
status: in-progress
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 220
priority: 71
pr: 7403
claim: "2026-09-02T19:27:56Z"
assignee: "move-object-inspect-and-to-s-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/core-ext/object/inspect.ts` (114 lines) implements
Ruby's `Object#inspect` and `Object#to_s`. It sits at a `core-ext/object/` path
where **Rails has no counterpart** — there is no `*inspect*` file anywhere under
`vendor/rails/activesupport/`, verified — so the whole file is permanently
unmatched surface in a Rails-measured package.

The file already says it is in the wrong home. Its header (`:1-15`):

> These are core Ruby, not Rails, but every body that needs them lives in
> ActiveSupport, and this file sits next to `blank.ts` — the same place the
> `Object#blank?` dispatch went — so the next caller finds one implementation
> rather than writing a third private copy.

and `toS` carries the receipt (`:102-107`):

> `@noRailsEquivalent PERMANENT` — Ruby core, not Rails: `Object#to_s` is
> defined in object.c, so no `.rb` in the vendored corpus declares it.

That receipt cites `object.c`, which is exactly the `vendor/ruby/<file>:<line>`
anchor ruby-compat's contract (README §2) asks for. The permanence does not
change on the move — there is no Rails method to converge onto, so it stays
`PERMANENT` — it simply stops being unanchored. This is the RFC's own pattern:
a Ruby primitive hand-rolled where it was first needed, parked in activesupport,
tagged and left.

**`blank.ts` is the contrast, and it does NOT move.**
`vendor/rails/activesupport/lib/active_support/core_ext/object/blank.rb` is a
real Rails file, and `packages/activesupport/src/core-ext/object/blank.ts`
(`isBlank:144`, `isPresent:186`, `presence:195`) mirrors it at the matching
path, measured by `parity:api` today. `present?` / `blank?` / `presence` are
ActiveSupport extensions, not Ruby core. Moving them would charge Rails' surface
to a non-Rails package and destroy working coverage — the inversion this RFC's
non-goals rule out. The header quoted above reasons by proximity to `blank.ts`;
that proximity is the mistake, because the two files have opposite provenance.

**The duplication half.** ruby-compat already contains three private re-rolls of
inspect behaviour, because there was no shared one to call:

- `packages/ruby-compat/src/comparable.ts:133` — a 3-line `inspect` for
  `rb_cmperr`'s `rb_inspect(y)` arm (`vendor/ruby/compar.c:32`).
- `packages/ruby-compat/src/hash.ts:49` — `inspectKey`, quoting a String key and
  passing a Symbol through bare.
- `packages/ruby-compat/src/symbol.ts:6` and `rational.ts:243-246` are genuine
  per-class `inspect` overrides (`sym_inspect`, `nurat_inspect`) and stay as
  they are — Ruby defines those separately too.

The first two are the "next port hand-rolls it again" outcome the RFC exists to
stop. Converge them onto the moved implementation if the semantics genuinely
match; where they do not, say so at the call site rather than widening the
shared function to cover a caller Ruby would not route through it.

**Leaf rule: this one is clean.** `inspect.ts` has **no imports at all**, and
`packages/ruby-compat/package.json` declares no dependencies. Unlike `Tempfile`
(`getCrypto`/`getFs`/`getPath`/`getOs`) and the `File`/`Dir` façade, this move
drags nothing with it and is not blocked on the platform-adapter question.

**Callers** — 6 non-test files today, all inside activesupport except the last:
`array-utils.ts:10` (both), `xml-mini.ts:9` (`toS`), `duration.ts:13`,
`core-ext/hash/conversions.ts:13`, `duration/iso8601-parser.ts:3`; plus the
public re-export at `activesupport/src/index.ts:756`. Two comments cite the file
by path and go stale on the move:
`duration/iso8601-parser.ts:183` and
`actionpack/src/action-controller/metal/implicit-render.ts:69`.

**A known limitation to carry across honestly.** `inspect`'s default arm returns
`to_s` rather than Ruby's `#<Foo:0x… @a=1>`, because JS exposes no object id;
the comment records that both callers pass plain data so the arm is unreached
today. Move that caveat with the code. Do not quietly upgrade it to a claim of
fidelity on arrival, and do not attempt the object-id form.

**Possible overlap.** An audit of activesupport for ruby-compat candidates is
running concurrently and may surface this same file. If it has already filed a
story for `inspect.ts`, close the duplicate rather than doing the work twice.

## Acceptance criteria

- [ ] `inspect.ts` and its tests move to `packages/ruby-compat/src/`, following
      the shape the value-type moves established (see
      `move-tempfile-to-ruby-compat` and PR #7237).
- [ ] Both exports carry both halves of the package contract: a resolving
      `vendor/ruby/<file>:<line>` citation — `object.c` for `Object#to_s` and
      `Object#inspect`, plus `array.c` / `hash.c` for the alias arms the body
      already names — and a `@noRailsEquivalent PERMANENT` receipt.
      `CONVERGEABLE` is a category error in this package (README §2).
- [ ] `packages/activesupport/src/core-ext/object/inspect.ts` becomes a
      re-export shim so `@blazetrails/activesupport`'s public surface
      (`index.ts:756`) is unchanged; the shim is deleted by a successor story,
      not here.
- [ ] `blank.ts` is untouched, and the moved file's header no longer reasons
      from sitting next to it.
- [ ] `comparable.ts:133`'s private `inspect` and `hash.ts:49`'s `inspectKey`
      either call the shared implementation or keep a one-line note saying why
      Ruby routes them differently. `symbol.ts` and `rational.ts` keep their own
      per-class overrides.
- [ ] The two stale path citations (`duration/iso8601-parser.ts:183`,
      `actionpack/.../implicit-render.ts:69`) are repointed.
- [ ] The `#<Foo:0x…>` limitation is preserved as a comment on the moved body.
- [ ] `pnpm parity:api:extra:gate` — ruby-compat is **pinned at 0 novel**, so
      the two new exports must land with receipts rather than raising `novel`;
      the `total` change is a reviewed line of this diff with the new figure in
      the PR body. No `tighten`, no reseed.
- [ ] `pnpm typecheck` green; the inspect/duration/xml-mini/conversions suites
      pass.
