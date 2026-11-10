---
rfc: "0227-media-gems-residual-parity"
title: "Media gems residual parity: image-processing, mini-magick, mini-mime and marcel"
status: active
created: 2026-11-09
updated: 2026-11-09
owner: "@deanmarano"
packages:
  - "image-processing"
  - "mini-magick"
  - "mini-mime"
  - "marcel"
clusters: []
---

# RFC 0227 — Media gems residual parity: image-processing, mini-magick, mini-mime and marcel

## Summary

Close the residual gaps the image_processing, mini_magick, mini_mime and marcel
ports left after RFCs 0202, 0203 and 0201 closed.

## Motivation

`pnpm parity:api` / `parity:test` on 2026-11-09 (fresh build):

| Package          | api       | tests                        |
| ---------------- | --------- | ---------------------------- |
| image-processing | 63 / 105  | 178 / 178 (1 PERMANENT skip) |
| mini-magick      | 114 / 125 | 145 / 145                    |
| mini-mime        | 21 / 23   | 8 / 9                        |
| marcel           | 32 / 32   | 20 / 20 (1 PERMANENT skip)   |

The image-processing and mini-magick gaps are crediting: the methods exist, but
`Processor` is not seated on its module and `Image`'s readers come from a class
macro the extractor does not read.

## Design

**image-processing:** a seating fix. The `Processor` / `Utils` classes exist
but are module-private, so the extractor cannot qualify them under
`ImageProcessing::MiniMagick` / `::Vips`. Seating them as the Ruby nesting does
fixes the port, not the tool.

**mini-magick:** an extractor fix. The gem and the port both generate `Image`'s
readers with the `attribute` macro, so the port is already faithful. The
extractor learns to credit that macro, gated to an explicit class list so no
other package's numbers move.

**mini-mime:** `PReadFile` is already ported in both arms, and only the class
arm inside a conditional static is uncredited, so that story is an extractor
fix. The parity test runs over vendored mime-types-data, with a test-support
stand-in for the six `MIME::Types` calls.

**marcel:** run the skipped test against rack 3's wrapper once the 0154 binary
buffer fix lands.

Prior art checked: the 0202 / 0203 / 0201 stories are all done or closed.
`port-assert-output` (RFC `0206-minitest-port-and-assertions-to-expect`) touches
image-processing's test helper only. `api-compare-gem-ports-without-api-rows`
(RFC `0136-trailmap`) is done and only enrolled packages, so it does not overlap
the mini-magick credit change. `rack-lint-input-read-admits-binary-buffer` (RFC
`0154-ruby-compat-surfaced-deviations`) is the marcel story's dependency.

## Non-goals

- **image-processing's thumbnail skip.** It is `PERMANENT-SKIP` under CLAUDE.md
  § "Method visibility is compile-time only".

## Alternatives considered

- **Rewrite `Image`'s readers as hand-written members** so the current
  extractor credits them. Rejected: the gem generates them with a macro, and
  rewriting the port to suit the tool is the wrong direction.
- **Keep marcel's skip.** Rejected: rack 3's wrapper meets the contract the test
  checks, so the skip is a version-naming gap, not a shortcoming.

## Rollout

One phase. All stories can run in parallel; only marcel's waits on its 0154
dependency.

1. `image-processing-processors-seated-on-their-modules`,
   `mini-magick-image-attribute-readers-credited`, `mini-mime-pread-file-credited`,
   `mini-mime-full-parity-with-mime-types-test`, `marcel-input-wrapper-test-on-rack-3`

## Verification

`pnpm parity:api`: all four packages 100%. `pnpm parity:test`: all four 100%
matched, with image-processing's one `PERMANENT-SKIP` the only skip.

## Open questions

1. **Does the mime-types parity test port without the gem?** Resolved: vendor
   mime-types-data as data only, and give the test a support helper for the six
   `MIME::Types` calls it makes. The mime-types gem is not vendored or ported.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
- 2026-11-09: revised for review feedback.
