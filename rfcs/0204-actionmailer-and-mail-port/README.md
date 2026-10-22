---
rfc: "0204-actionmailer-and-mail-port"
title: "ActionMailer, and the mail gem it builds messages with"
status: draft
created: 2026-10-22
updated: 2026-10-22
owner: "@deanmarano"
packages:
  - mail
  - mini-mime
  - net-smtp
  - actionmailer
  - trailties
clusters:
  - mail-vendor
  - mail-core
  - mail-delivery
  - actionmailer
  - trailties
---

# RFC 0204 — ActionMailer, and the mail gem it builds messages with

## Summary

Port ActionMailer (`vendor/rails/v8.0.2/actionmailer`, 2,620 lib lines across
22 files, 263 tests) and the one gem it adds over packages trails already has: `mail` 2.8.1
(`vendor/rails/v8.0.2/Gemfile.lock:339-343`), with `mini_mime` 1.1.5 (`:355`).
`mail` is ported line for line as `@blazetrails/mail`. Only its transport edge
is backed by npm: `Net::SMTP` (its own package, `net-smtp`) drives nodemailer's
low-level `SMTPConnection`, and `Mail::Sendmail` / `Exim` spawn a child process as Ruby's
`IO.popen` does. Delivery is async.

## Motivation

ActionMailer's gemspec depends on activesupport, actionpack, actionview,
activejob, rails-dom-testing and `mail` (`actionmailer.gemspec:36-42`). All but
`mail` are ported. ActionMailer reaches deep into `Mail::Message`: header
assignment, `charset`, `content_type`, `parts` / `add_part`, `attachments`,
`body`, `encoded`, `Mail::Address` for `email_address_with_name`, the
delivery-method registry, and `Mail.register_interceptor` / `register_observer`.
Its tests assert the encoded bytes, header order and boundary shape, so an npm
MIME builder (nodemailer's `MailComposer`) cannot stand in for `Mail::Message`.

Shape of `mail` 2.8.1's `lib/mail`:

| Part                                          | Lines  | Notes                                       |
| --------------------------------------------- | ------ | ------------------------------------------- |
| root (`message`, `header`, `body`, `part`, …) | 5,241  | pure Ruby                                   |
| `fields/`                                     | 1,824  | one class per header field                  |
| `elements/`                                   | 521    | parsed field values                         |
| `parsers/*.rb`                                | 56,441 | Ragel output, from 1,360 lines of `.rl`     |
| `encodings/`                                  | 262    | base64, quoted-printable, 7bit/8bit, binary |
| `network/delivery_methods/`                   | 526    | SMTP, sendmail, exim, file, test, logger    |
| `network/retriever_methods/`                  | 439    | POP3, IMAP: not used by ActionMailer        |
| `multibyte/`                                  | 767    | `Mail::Multibyte::Chars`                    |

## Design

### mail is ported, not wrapped

`Message`, `Header`, `Field` and `fields/`, `Body`, `Part`, `PartsList`,
`AttachmentsList`, `Encodings`, `Utilities` and `elements/` port line for line
into `packages/mail`. Strings follow CLAUDE.md "Ruby Strings are JS string
primitives": a decoded body in an ASCII-8BIT String is a `Uint8Array`, and a
non-UTF-8 charset is transcoded with npm `iconv-lite` where Ruby calls
`String#encode`.

### The Ragel parsers are transliterated from their generated Ruby (recommended)

This is Open question 1's recommendation, not yet a ruling. Ragel is a C++
state-machine compiler the gem's maintainers run at development time; it is not
a gem and not a runtime dependency. The grammars changed last in May 2017
("Parse UTF-8 mail headers per RFC6532"); every later commit to
`lib/mail/parsers/` is a mechanical regeneration, and none touched them after
2022-12, through mail 2.9.1. Ragel 6 has no JavaScript target. The generated `parsers/*.rb` are a state
machine over packed integer tables plus action bodies. A script transliterates
each one (tables as typed arrays, the driver loop as written, the action bodies
by hand-checked rules) and is kept in `scripts/` so a mail bump regenerates them.
This keeps `Mail::Parsers::AddressListsParser` and its siblings at their Rails
names and byte-exact on malformed input, which `mail`'s specs exercise. The `.rl` files are vendored as reference and
each generated TS parser cites its `.rl` source.

`mail-address-lists-parser-spike` runs the script on the largest parser first
and records the outcome; the other eleven wait on it. If the spike fails, the
fallback is a hand port of the `.rl` grammars.

### Generated parsers and the LOC ceiling

The transliterated parsers are generated output, but no repo convention
excludes generated source from the PR LOC ceiling (only lockfiles, snapshots
and parity fixtures). The parser PRs ask the repo owner for a waiver in the PR
body; `est-loc` on those stories counts the script and driver only. A CI step
re-runs the script over the vendored gem and fails on any diff.

### Transport edges

- **`Mail::SMTP`** (`network/delivery_methods/smtp.rb`) is ported as written
  over `Net::SMTP`. `Net::SMTP` is its own package, `packages/net-smtp`, as each
  gem is: its client surface (`new`, the TLS toggles, timeouts, `start`,
  `sendmail`, `finish`, the error classes) keeps its Ruby names, and the wire
  protocol under it is nodemailer's `lib/smtp-connection`, never
  `createTransport`, which builds its own MIME. The unported protocol internals
  are a scoped skip citing this section.
- **`Mail::Sendmail` / `Exim`** spawn the binary with the same argv and write
  `message.encoded` to stdin, through `child_process.spawn`, as `IO.popen` does.
- **`FileDelivery`, `TestMailer`, `LoggerDelivery`**: pure, ported as written.

### Delivery is async

`Mail::Message#deliver`, every delivery method's `deliver!`, and ActionMailer's
`deliver_now` / `deliver_now!` / `deliver_later` are `async`, under the reasoning
of CLAUDE.md "A job's `perform` and `enqueue` are async": SMTP and sendmail are
I/O, and a sync `deliver` would return before the message left and run the
observers first. Building a message (`mail(…)`, rendering, `encoded`) stays sync.
That CLAUDE.md section is extended to name delivery when this lands.

### mini_mime

`mini_mime` is a small gem over a flat-file DB of extensions and types. It is
ported with its DB vendored, rather than read through `marcel`, because `mail`
calls `MiniMime.lookup_by_filename` / `lookup_by_extension` and its fixtures
pin the gem's answers.

## Non-goals

- **Retriever methods** (`POP3`, `IMAP`, `Mail.all` / `find`) and the `net-imap` /
  `net-pop` gems: ActionMailer never calls them. `mail` requires them only
  inside the retriever classes (`retriever_methods/pop3.rb:36`,
  `imap.rb:40`), so leaving those classes unported leaves no `require` to
  satisfy. The gemspec runtime dependency is not mirrored in `package.json`.
  ActionMailbox may want them later.
- **ActionMailbox**: its own RFC.

## Alternatives considered

- **Wrap nodemailer's `MailComposer` behind `Mail::Message`**: rejected. It owns
  header order, boundaries and encodings, so ActionMailer's and mail's assertions
  on encoded output cannot match.
- **Wrap an npm address parser** (`email-addresses`, `addressparser`) behind
  `Mail::Address`: rejected in favour of transliteration, as each disagrees
  with RFC 5322 handling `mail`'s specs pin, and the rest of the parsers have no
  npm counterpart anyway.
- **nodemailer's `createTransport`** for SMTP: rejected, see Transport edges.

## Rollout

Every `lib` file of `mail` (outside the retriever methods), `mini_mime`,
`Net::SMTP`'s client surface and ActionMailer has an owning story.

1. Vendor: `vendor-mail-mini-mime-and-net-smtp`
2. Leaves, in parallel: `mini-mime-port`, `net-smtp-port`,
   `mail-encodings-and-utilities` → `mail-multibyte`
3. Parsers: `mail-address-lists-parser-spike` → `mail-ragel-parsers-remaining`
4. Fields: `mail-elements` → `mail-common-and-address-fields` →
   `mail-remaining-header-fields` → `mail-header-field-and-field-list`
5. Message: `mail-body-part-and-attachments` → `mail-message-core` →
   `mail-message-parts-and-encoding`
6. Delivery: `mail-delivery-methods-smtp-sendmail-file-test`
7. ActionMailer: `actionmailer-package-and-support-modules` →
   `actionmailer-base-class-api` → `actionmailer-base-mail-and-collector` →
   `actionmailer-message-delivery-parameterized-and-delivery-job` →
   `actionmailer-test-helper-test-case-and-preview` →
   `actionmailer-railtie-and-mailer-generator`

## Verification

- `mail` 2.8.1's specs (83 files, 1,674 examples; RSpec, ported as thor's were)
  less the retriever specs, and ActionMailer's 263 tests pass, each skip a
  `PERMANENT-SKIP` citing a ruling.
- `parity:api` and `parity:test` report `mail`, `mini-mime`, `net-smtp` and
  `actionmailer`.
- The parser regeneration check is green.
- SMTP is exercised against a local SMTP sink in CI (`smtp4dev` or nodemailer's
  `smtp-server`).

## Open questions

1. **Transliteration of the Ragel output**: the generated Ruby (recommended,
   regenerable from the vendored gem), or a hand port of the `.rl` grammars into
   a JS state-machine generator. The second is ~1.4k lines of grammar but needs a
   Ragel backend nobody maintains. Resolved by `mail-address-lists-parser-spike`.
2. **SMTP sink in CI**: npm `smtp-server` in-process (recommended, no service
   container) or a `smtp4dev` service. The delivery and `net-smtp` stories
   assume the recommendation; resolve before the RFC goes `active`.

## Changelog

- 2026-10-22: initial draft
- 2026-10-22: review: split oversized stories, owners for every lib file
  (Multibyte, railtie, support modules), `net-smtp` package, parser spike and
  drift check, LOC-waiver and test counts stated
