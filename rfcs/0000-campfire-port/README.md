---
rfc: "0000-campfire-port"
title: "Port Campfire, with the gems it needs"
status: draft
created: 2026-11-27
updated: 2026-11-27
owner: "@deanmarano"
packages:
  - addressable
  - geared-pagination
  - ruby-compat
  - jwt
  - web-push
  - autolink
  - useragent
  - platform-agent
  - surfguard
  - lexxy
  - actioncable
  - actiontext
clusters:
  - campfire-deps
  - campfire-app
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Port Campfire, with the gems it needs

## Summary

Port 37signals' Campfire (`basecamp/once-campfire`, MIT, tag `v1.5.13`) to
trails as a second example app after Writebook (trails#10716). Campfire is
about the same size as Writebook in Ruby but leans on the framework surface
Writebook barely touched: Action Cable (seven channels, presence, typing
notifications, remote disconnects), web push, Action Text with the Lexxy
editor, and pagination. The gems it depends on are ported first, each as its
own package and story, so the app port finds framework gaps rather than gem
gaps.

## Motivation

Writebook surfaced framework bugs in nine packages (RFC 0260). It exercised
Active Record, Action View, Active Storage and Turbo, but has two channels and
24 lines of Action Cable code. Campfire, counted from a clone of `main` on
2026-11-27:

| Area        | Writebook (v1.2.9) | Campfire    |
| ----------- | ------------------ | ----------- |
| Models      | 38 / 1,877 lines   | 45 / 1,828  |
| Controllers | 41 / 1,315         | 48 / 1,591  |
| Views       | 94 / 2,012         | 90 / 2,347  |
| JavaScript  | 31 / 1,069         | 71 / 3,855  |
| Channels    | 2 / 24             | 10 / 189    |
| Jobs        | 1 / 7              | 6 / 35      |
| Migrations  | 11 / 250           | 18 / 312    |
| Ruby tests  | 66 / 5,216         | 107 / 9,206 |

The new surface is real-time: `ActionCable.server.remote_connections`
(`app/models/user.rb:98`, already ported in
`packages/actioncable/lib/remote-connections.ts`), Turbo Stream broadcasts,
web push delivered from a thread pool, and Action Text mentions through
`attachable_sgid`.

## Design

### Gems ported as packages (cluster `campfire-deps`)

Each gem is ported from its released source, vendored in
`vendor/sources.ts`, to the slice Campfire and the gem's own tests reach.
Package names follow the existing rule: a `rails` token is dropped
(`rails-html-sanitizer` is `html-sanitizer`), and snake_case becomes
kebab-case.

| Gem                 | Version | Ruby lib lines | Campfire use                                                      | Package                        |
| ------------------- | ------- | -------------- | ----------------------------------------------------------------- | ------------------------------ |
| `addressable`       | 2.8.x   | 11,564         | `URI.parse`, `query_values`, `query_values=`, `to_s` (via geared) | `addressable`                  |
| `geared_pagination` | 1.2.0   | 513            | `set_page_and_extract_portion_from` in three controllers          | `geared-pagination`            |
| `jwt`               | 3.3.x   | 2,925          | ES256 `JWT.encode` for the VAPID header (via web-push)            | `jwt`                          |
| `web-push`          | 3.1.0   | 475            | `WebPush.payload_send`, `Request`, errors                         | `web-push`                     |
| `rails_autolink`    | 1.1.8   | 173            | `auto_link` in `MessagesHelper`                                   | `autolink`                     |
| `useragent`         | 0.16.11 | 1,531          | via `platform_agent`                                              | `useragent`                    |
| `platform_agent`    | 1.0.1   | 119            | `ApplicationPlatform < PlatformAgent`                             | `platform-agent`               |
| `surfguard`         | main    | 404            | `Surfguard.resolve_public_ips`, SSRF guard for push endpoints     | `surfguard`                    |
| `lexxy`             | 0.9.24  | 281            | `rich_text_area` override, `lexxy_prompt`, attachables, engine    | `lexxy`                        |
| `rqrcode`           | —       | —              | `QrCodeController`                                                | existing story `rqrcode-port`  |
| `jbuilder`          | —       | —              | eight `.jbuilder` views                                           | existing story `jbuilder-port` |

`addressable` is ported to the four methods geared_pagination calls, not
whole: `query_values=` sorts a Hash's pairs (`addressable/uri.rb:1888`) and
percent-encodes with the RFC 3986 unreserved set, so `URLSearchParams` alone
gives a different URL. Parsing delegates to Node's `URL`.

`web-push` needs OpenSSL classes ruby-compat does not have:
`OpenSSL::PKey::EC` (with `EC::Group`, `EC::Point`), `OpenSSL::KDF.hkdf`,
`OpenSSL::BN` and the `OpenSSL::ASN1` subset that converts a raw P-256 key to
DER. Node's `crypto` has each primitive (`createECDH("prime256v1")`,
`hkdfSync`, `aes-128-gcm`, ES256 `sign`). They land in
`packages/ruby-compat/lib/openssl.ts` beside the existing `Cipher` and `RSA`.
`jwt` is ported to `JWT.encode` with ES256, the only path web-push takes.

`lexxy` is a Rails engine: it reopens `ActionView::Helpers::FormHelper` and
`FormBuilder` to swap `rich_text_area` for `<lexxy-editor>`. That reopen is
the operator's 2026-11-17 ruling on ActionText's `tag_helper.rb` (trails
CLAUDE.md, "A Ruby module is a JS object or a JS class"); the story confirms
that ruling covers Lexxy or files the question. The browser half is the npm
`@37signals/lexxy` package, a dependency, not a port.

### Infrastructure Campfire swaps out

Campfire runs on Redis (cable adapter, cache store) and Resque (job adapter).
The port uses the vendored Solid Cable, Solid Cache and Solid Queue instead,
as the ActiveJob plan already directs (no third-party queue adapters). These
are config changes in the app, each receipted where the file differs.
`remote_connections.where(current_user:).disconnect` works over any pub/sub
adapter, so nothing in the models changes.

### The app (cluster `campfire-app`)

`examples/campfire` mirrors Campfire file for file, as
`examples/electron-writebook` mirrors Writebook, with views as `.tse`,
JavaScript bundled by Vite and Stimulus controllers copied as written. Like
Bookshelf, it ships under its own name and without 37signals' marks. Whether
it runs as a server app or inside Electron is an open question.

## Non-goals

- **`kredis`:** in the Gemfile, used nowhere in the app.
- **`redis`, `resque`, `resque-pool`:** replaced by Solid Cable, Solid Cache and Solid Queue.
- **`sentry-ruby`, `sentry-rails`:** error reporting to a hosted service; the initializer is omitted.
- **`thruster`:** an HTTP/2 proxy binary in front of Puma, not Ruby code.
- **`importmap-rails`, `propshaft`:** out of scope repo-wide; Vite serves assets.
- **All of `addressable`:** templates, IDN and normalization wait for a caller.
- **All of `jwt`:** decode, verification and non-ES256 algorithms wait for a caller.

## Alternatives considered

- **Stand-ins over npm packages** (`ua-parser-js` for useragent, `web-push`
  from npm, a hand-written autolinker): each loses the Ruby behaviour the app
  reads, and Writebook's `redcarpet` stand-in became debt (`redcarpet-port`).
  Ports, with Node primitives underneath, match how `bcrypt` and `pg` went.
- **Port the app first, gems as they block:** Writebook did this, and its
  framework fixes and gem stand-ins landed in one 10k-line PR. Gems first
  keeps each PR inside the LOC ceiling.

## Rollout

1. Gems with no new crypto, in parallel: `addressable-uri-query-values`,
   `geared-pagination-port`, `rails-autolink-port`, `useragent-port`,
   `platform-agent-port`, `surfguard-port`, `lexxy-engine-port`, plus the
   existing `rqrcode-port` and `jbuilder-port`.
2. Crypto: `ruby-compat-openssl-pkey-ec`, `ruby-compat-openssl-kdf-bn-asn1`,
   then `jwt-es256-encode`, then `web-push-port`.
3. App: `vendor-campfire-source`, then `campfire-models-and-migrations`,
   `campfire-channels`, `campfire-controllers-views-helpers`,
   `campfire-jobs-and-web-push`, `campfire-javascript`, `campfire-tests`.

## Verification

- Every gem story ports the gem's own test cases for the surface it ports, and
  `parity:test` credits them.
- Campfire's 107 Ruby test files are ported under `examples/campfire/test`
  and pass on SQLite.
- The app boots, two browser sessions in one room see each other's messages,
  presence and typing indicators, and removing a member disconnects their
  socket.
- Every framework bug the port finds is a story in its package's
  surfaced-deviations bucket, not a fix inside the app.

## Open questions

1. **Server or Electron.** Campfire is multi-user chat, so a server app (rackup
   with Solid Cable on SQLite) is the faithful shape; Electron would only work
   as one client. Recommendation: server app, `examples/campfire`.
2. **SQLite WAL checkpoint.** `lib/rails_ext/sqlite_wal_checkpoint.rb` starts a
   checkpoint contender in every non-test process and handles Puma and
   resque-pool forks. trails has no `fork` (CLAUDE.md, "Runtime facts Node
   does not expose"). Recommendation: port the single-process arm and drop the
   fork handling with a receipt.
3. **Lexxy reopen.** Does the 2026-11-17 `FormHelper` includer-list ruling
   extend to Lexxy's engine, or does Lexxy need its own ruling?
4. **Package home for rqrcode and jbuilder.** Their stories sit in
   `0142-trailties-surfaced-deviations`; move them here or leave them and
   depend on them by id. Recommendation: leave them, depend by id.

## Changelog

- 2026-11-27: initial RFC
