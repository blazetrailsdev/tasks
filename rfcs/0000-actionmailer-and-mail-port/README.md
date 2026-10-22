---
rfc: "0000-actionmailer-and-mail-port"
title: "ActionMailer, and the mail gem it builds messages with"
status: draft
created: 2026-10-22
updated: 2026-10-22
owner: "@deanmarano"
packages:
  - mail
  - mini-mime
  - actionmailer
clusters:
  - mail-vendor
  - mail-core
  - mail-delivery
  - actionmailer
---

<!-- Unnumbered until merge -->

# RFC — ActionMailer, and the mail gem it builds messages with

## Summary

Port ActionMailer (`vendor/rails/v8.0.2/actionmailer`, 2,503 lib lines, 263
tests) and the one gem it adds over packages trails already has: `mail` 2.8.1
(`vendor/rails/v8.0.2/Gemfile.lock:339-343`), with `mini_mime` 1.1.5 (`:355`).
`mail` is ported line for line as `@blazetrails/mail`. Only its transport edge
is backed by npm: `Mail::SMTP` drives nodemailer's low-level
`SMTPConnection`, and `Mail::Sendmail` / `Exim` spawn a child process as Ruby's
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

### The Ragel parsers are transliterated from their generated Ruby

Ragel 6 has no JavaScript target. The generated `parsers/*.rb` are a state
machine over packed integer tables plus action bodies. A script transliterates
each one (tables as typed arrays, the driver loop as written, the action bodies
by hand-checked rules) and is kept in `scripts/` so a mail bump regenerates them.
This keeps `Mail::Parsers::AddressListsParser` and its siblings at their Rails
names and byte-exact on malformed input, which `mail`'s specs exercise.

### Transport edges

- **`Mail::SMTP`** (`network/delivery_methods/smtp.rb`) is written over
  `net-smtp`'s `Net::SMTP` (`start`, `enable_starttls`, `send_message`).
  `Net::SMTP` is ported as the thin surface `smtp.rb` calls, backed by
  nodemailer's `lib/smtp-connection` (connect, `login`, `send`), never by
  `createTransport`, which builds its own MIME.
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
  `net-pop` gems: ActionMailer never calls them. ActionMailbox may want them later.
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

1. Vendor: `vendor-mail-mini-mime-and-net-smtp`
2. `mini-mime-port`
3. Core: `mail-ragel-parsers-transliterated`, `mail-fields-and-elements`,
   `mail-message-body-part-and-encodings`
4. Delivery: `mail-delivery-methods-smtp-sendmail-file-test`
5. ActionMailer: `actionmailer-base-and-collector`,
   `actionmailer-message-delivery-parameterized-and-delivery-job`,
   `actionmailer-test-helper-test-case-and-preview`

## Verification

- `mail`'s specs (RSpec, ported as thor's were) and ActionMailer's tests pass,
  each skip a `PERMANENT-SKIP` citing a ruling.
- `parity:api` and `parity:test` report `mail`, `mini-mime` and `actionmailer`.
- SMTP is exercised against a local SMTP sink in CI (`smtp4dev` or nodemailer's
  `smtp-server`).

## Open questions

1. **Transliteration of the Ragel output**: the generated Ruby (recommended,
   regenerable from the vendored gem), or a hand port of the `.rl` grammars into
   a JS state-machine generator. The second is ~1.4k lines of grammar but needs a
   Ragel backend nobody maintains.
2. **SMTP sink in CI**: npm `smtp-server` in-process (recommended, no service
   container) or a `smtp4dev` service.

## Changelog

- 2026-10-22: initial draft
