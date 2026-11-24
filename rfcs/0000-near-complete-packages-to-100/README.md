---
rfc: "0000-near-complete-packages-to-100"
title: "Every package at 97% or above reaches 100%"
status: active
created: 2026-11-24
updated: 2026-11-24
owner: "@deanmarano"
packages:
  - activerecord
  - activesupport
  - actionpack
  - actionview
  - actioncable
  - actionmailbox
  - actionmailer
  - activejob
  - activestorage
  - rack-session
  - sqlite3
  - mini-magick
  - turbo
  - trailties
  - solid-queue
  - nokogiri
  - libxml-ruby
  - scripts
related-rfcs:
  - "0255-last-mile-parity"
  - "0186-pg-gem-port"
clusters:
  - rails-core
  - small-packages
  - scoping
---

<!-- Unnumbered until merge. -->

# RFC — Every package at 97% or above reaches 100%

## Summary

Every package whose `parity:api` or `parity:test` figure is at or above 97%
reaches 100% on that figure. An item counts as done once it is ported, or once
it is out of the denominator through a `PERMANENT-SKIP:` line, a per-test
`tests:` row, an `unported-files` row or a `SKIP_GROUPS` entry. The 0255
mechanism makes that count. The operator ruled on 2026-11-24 that moving an
item out of the denominator is an acceptable way to close it. The same RFC
scopes nokogiri and libxml-ruby to the surface trails' callers reach, as RFC
0186 scoped pg to what activerecord calls.

## Motivation

Measured on 2026-11-24 at trails `4330f807e1` with
`pnpm parity:test -- --missing --json`. The score is
`(matched - skipped) / (total - permanent)`
(`scripts/test-compare/compare.ts:1496-1498`), so an item is open while it is
either missing or skipped without a `PERMANENT-SKIP:` line.

| Package           | test % | gap | non-permanent skips | missing |
| ----------------- | -----: | --: | ------------------: | ------: |
| actionview        |   98.4 |  41 |                   7 |      34 |
| activerecord      |   99.6 |  39 |                   4 |      35 |
| actiondispatch    |   97.9 |  35 |                  15 |      20 |
| activesupport     |   99.2 |  29 |                  14 |      15 |
| actioncontroller  |   99.3 |  14 |                   6 |       8 |
| actionmailer      |   98.4 |   4 |                   4 |       0 |
| actioncable       |   99.1 |   2 |                   0 |       2 |
| actionmailbox     |   98.1 |   2 |                   0 |       2 |
| activejob         |   99.8 |   1 |                   0 |       1 |
| rack-session      |   99.2 |   1 |                   1 |       0 |
| sqlite3           |   99.1 |   1 |                   0 |       1 |
| mini-magick       |   99.3 |   1 |                   0 |       1 |
| rails-dom-testing |   98.4 |   1 |                   0 |       1 |
| turbo-rails       |   99.6 |   1 |                   1 |       0 |

On the trailmap packages page, these packages show API figures at or above
97% but short of 100%: activerecord (7,019 / 7,037), activesupport
(2,311 / 2,331), actionview (3,157 / 3,159), activestorage (694 / 700),
trailties (1,759 / 1,769) and solid-queue (951 / 956).

Several of the missing tests landed with the v8.0.5.2 bump (RFC 0256): for
example actioncable "unsubscribed? method returns correct status" and
actionmailbox's two Mailgun timestamp tests. 0255 closed on 2026-11-22 with
every package it listed at its target, so most of today's gap is new since
then.

nokogiri (API 41.3%, tests 27.4%) and libxml-ruby (22%, 1.8%) are scored
against the whole gem. trails needs only what its callers reach. For
nokogiri that is rails-dom-testing, html-sanitizer, actionview, actiontext
and ActiveSupport's `XmlMini_Nokogiri`. For libxml-ruby it is `XmlMini_LibXML`.
This RFC does not bring either package to 100%. Scoping them makes their
figures measure what trails uses, as `scripts/parity/unported-files/pg.ts`
does for pg.

## Design

### Triage rule (every package story)

Each open item ends in one of four states:

1. **Ported.** The test runs the Rails body and passes, or the member exists
   under its Rails name.
2. **Permanent, ratified.** `it.skip` under a `PERMANENT-SKIP:` line citing a
   CLAUDE.md section or a dated operator ruling. For an unwritten test, a
   `tests:` row in `scripts/parity/unported-files/<pkg>.ts` instead. For API,
   an `unported-files` or `SKIP_GROUPS` entry with its reason.
3. **Permanent, awaiting ruling.** The story lists the item with its Rails
   `file:line` and the fact that blocks it, and the operator rules. Nobody
   invents a ratification.
4. **Blocked on a story.** Filed with a `deps` edge, and it stays open. This
   state does not count toward 100%, so a package story that ends with items
   here stays open too.

0255's lesson applies: before calling an item permanent, try to disprove the
receipt with a run, a grep or an MRI check.

### Scoping nokogiri and libxml-ruby

The scoping stories follow the pg model (RFC 0186 § "Scoring"). They build
the set of gem members that trails' callers reach, and add an
`unported-files/<pkg>.ts` file-level row ("not called by trails") for every
gem file outside that set. A file in the set that is only partly reached gets
`SCOPED_SKIP_GROUPS` rows for the members nothing calls. The call graph is
taken from the Ruby callers in `vendor/rails/v8.0.5.2/` and the vendored
rails-html-sanitizer and rails-dom-testing, not from the current TS port.
That way an unported caller still pulls its callee into scope.

## Non-goals

- **Packages below 97%** (activestorage tests 90.3%, trailties tests 75.8%,
  tzinfo, html-sanitizer, pg tests, solid-queue tests): out of scope. The one
  exception is the API figure, where a package qualifies on that metric
  alone.
- **ruby-compat's figures:** its denominator is a separate question for the
  operator.
- **Taking nokogiri or libxml-ruby to 100%:** this RFC only scopes them.

## Alternatives considered

- **Port everything with no denominator moves:** rejected by the operator
  ruling above. Some items are permanently unportable, and a 100% target
  that cannot be reached tells nobody anything.
- **One story per test:** too fine-grained. A package story with a list is
  enough, and it can file sub-stories when it outgrows the LOC ceiling.

## Rollout

1. Small packages: `small-packages-reach-100`.
2. Rails core, in parallel: `activerecord-reaches-100`,
   `activesupport-reaches-100`, `actionview-reaches-100`,
   `actiondispatch-reaches-100`, `actioncontroller-reaches-100`,
   `api-near-complete-packages-reach-100`.
3. Scoping: `nokogiri-scored-on-what-trails-callers-reach`,
   `libxml-ruby-scored-on-what-xml-mini-reaches`.

## Verification

- `pnpm parity:test` shows 100.0 for every package in the Motivation table.
- trailmap shows API 100% for activerecord, activesupport, actionview,
  activestorage, trailties and solid-queue.
- Every remaining skip in those packages carries `PERMANENT-SKIP:` with a
  citation.
- nokogiri's and libxml-ruby's denominators shrink to the scoped set, and each
  removed file carries a reason.

## Open questions

- Does the 2026-11-24 ruling also cover API members that trails ports but
  scores under another name? The default answer is no: a mis-credited member
  is fixed in the extractor, not removed from the denominator.
