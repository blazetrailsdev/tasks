---
title: "Pass the 18 image_spec examples left it.fails (get_pixels, pack S, ctor block)"
status: draft
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After the bundle that took `packages/mini-magick` to zero tsc errors, 18 examples
in `packages/mini-magick/src/image.test.ts` stay `it.fails`
(`// BLOCKED: mini-magick-image-spec-remaining-fails`):

- `#get_pixels` (15): Rails' `let(:pix) { subject.get_pixels }` is lazy
  (`vendor/mini_magick/v5.2.0/spec/lib/mini_magick/image_spec.rb:471-560`), so it
  runs after a nested context's `before { subject.crop ... }`. The port reads
  `pix` in an outer `beforeEach` before `subject` is even reassigned, reads
  `subject.width` without calling it, and indexes `pix[-4]` where Ruby's
  negative index needs `.at(-4)`.
- `.import_pixels` (2): `pixels.pack('S*')` (`image_spec.rb:36`) raises
  `unknown pack directive 'S'` in ruby-compat's `pack`
  (`packages/ruby-compat/src/array.ts`); MRI's `S` is `pack.c`'s 16-bit
  unsigned native-endian directive.
- `#initialize accepts a block which it passes on to #combine_options` (1):
  `Image#initialize` calls `combine_options(&block)` (`image.rb`), which is async
  (`mogrify`), so the constructor cannot await it; the spec reads `dimensions`
  before the mogrify has run.

## Acceptance criteria

- `#get_pixels` examples port the lazy `let` (read `pix` inside each example)
  and pass.
- ruby-compat `pack` / `unpack` support `S` with an MRI `pack.c` citation, and
  the two `.import_pixels` examples pass.
- The constructor-block example is decided: converged, or parked
  `PERMANENT-SKIP` against a ratified section.
