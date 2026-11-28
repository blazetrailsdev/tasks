---
rfc: "0000-campfire-port"
title: "Port Campfire, with the gems it needs"
status: draft
created: 2026-11-27
updated: 2026-11-27
owner: "@deanmarano"
max-est-loc: 2500 # app stories port a file group with its tests; see "The LOC ceiling is lifted for the app stories"
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
  - actionpack
  - actionview
  - activerecord
  - activejob
  - activestorage
  - solid-cable
  - solid-cache
  - solid-queue
  - stimulus
  - turbo
  - vite-trails
  - examples
  - scripts
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
| Stylesheets | —                  | 3,378       |

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
| `addressable`       | 2.10.0  | 11,564         | `URI.parse`, `query_values`, `query_values=`, `to_s` (via geared) | `addressable`                  |
| `geared_pagination` | 1.2.0   | 513            | `set_page_and_extract_portion_from` in three controllers          | `geared-pagination`            |
| `jwt`               | 3.3.1   | 2,925          | ES256 `JWT.encode` for the VAPID header (via web-push)            | `jwt`                          |
| `web-push`          | 3.1.0   | 475            | `WebPush.payload_send`, `Request`, errors                         | `web-push`                     |
| `rails_autolink`    | 1.1.8   | 173            | `auto_link` in `MessagesHelper`                                   | `autolink`                     |
| `useragent`         | 0.16.11 | 1,531          | via `platform_agent`                                              | `useragent`                    |
| `platform_agent`    | 1.0.1   | 119            | `ApplicationPlatform < PlatformAgent`                             | `platform-agent`               |
| `surfguard`         | git     | 404            | `Surfguard.resolve_public_ips`, SSRF guard for push endpoints     | `surfguard`                    |
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
`FormBuilder` to swap `rich_text_area` for `<lexxy-editor>`, after
`ActionView::Base` has included them. The operator's 2026-11-17 ruling
licenses an includer list for ActionText's reopen of those two modules and
"for no other module" (trails CLAUDE.md, "A Ruby module is a JS object or a JS
class"), so Lexxy's reopen needs its own ruling (Open question 3). The editor
itself ships built in the gem (`app/assets/javascript/lexxy.js`) and is copied
byte for byte.

`useragent` is also what Rails' `AllowBrowser` parses with
(`actionpack/lib/action_controller/metal/allow_browser.rb:89-91`). trails uses
ua-parser-js there, and `allow-browser-parses-with-ua-parser-js-not-the-useragent-gem`
(RFC 0141) is blocked on the operator decision to vendor and port the gem.
Approving this RFC makes that decision, and `useragent-port` unblocks it.

Every new package is vendored in `vendor/sources.ts` and registered the way a
new package must be (`ci.yml` lanes, the workspace guard fixture).

### Infrastructure Campfire swaps out

Campfire runs on Redis (cable adapter, cache store) and Resque (job adapter).
The port uses the vendored Solid Cable, Solid Cache and Solid Queue instead,
as the ActiveJob plan already directs (no third-party queue adapters). These
are config changes in the app, each receipted where the file differs.
`remote_connections.where(current_user:).disconnect` works over any pub/sub
adapter, so nothing in the models changes.

### The app (cluster `campfire-app`)

`examples/campfire` mirrors Campfire file for file, as
`examples/electron-writebook` mirrors Writebook: views as `.tse`, JavaScript
bundled by Vite, Stimulus controllers and stylesheets copied as written. Like
Bookshelf, it ships under its own name and without 37signals' marks.

Campfire tracks Rails `main` (8.2.0.alpha) on Ruby 4.0.10, and its migrations
are `Migration[7.2]`. trails targets Rails 8.0.5.2, so the port uses
`Migration.get(8.0)` as Bookshelf does, and any 8.1+ API Campfire calls is
filed against its package rather than shimmed in the app.

The app is split by file group. Each story ports its files together with
their tests, so every story ends green:

| Story                                         | Files                                                            | est-loc |
| --------------------------------------------- | ---------------------------------------------------------------- | ------- |
| `vendor-campfire-source`                      | `vendor/sources.ts` entry                                        | 30      |
| `campfire-app-skeleton`                       | config, environments, initializers, migrations, fixtures         | 1,900   |
| `campfire-models-rooms-memberships-accounts`  | `Room`, `Rooms::*`, `Membership`, `Account` + tests              | 1,400   |
| `campfire-models-users-messages-push`         | `User`, `Message`, `Push`, `Session`, `Sound`, `Webhook` + tests | 1,950   |
| `campfire-models-opengraph-and-caches`        | `Opengraph`, the three caches, `FirstRun` + tests                | 1,100   |
| `campfire-lib-rails-ext-and-restricted-http`  | `lib/rails_ext`, `lib/restricted_http`, rake tasks + tests       | 850     |
| `campfire-channels`                           | `app/channels` + tests                                           | 460     |
| `campfire-helpers`                            | `app/helpers` + tests                                            | 1,260   |
| `campfire-controllers-top-level-and-concerns` | concerns, top-level controllers, jbuilder views + tests          | 2,450   |
| `campfire-controllers-namespaced`             | namespaced controllers + tests                                   | 2,400   |
| `campfire-views`                              | 90 views as `.tse`                                               | 2,350   |
| `campfire-jobs-web-push-and-wal-checkpoint`   | jobs, `lib/web_push`, WAL checkpoint + tests                     | 1,100   |
| `campfire-javascript-controllers`             | Stimulus controllers, helpers, initializers, copied              | 2,000   |
| `campfire-javascript-lib-and-models`          | `app/javascript/lib` and `models`, copied                        | 1,950   |
| `campfire-stylesheets-a-to-l`                 | 17 stylesheets, copied                                           | 2,000   |
| `campfire-stylesheets-m-to-z-and-images`      | 9 stylesheets and the images, copied                             | 1,450   |
| `campfire-system-tests`                       | system, integration, middleware tests                            | 1,300   |

### The LOC ceiling is lifted for the app stories

The gem stories stay inside the 700 ceiling. The app stories do not: Campfire
is about 26,000 lines counting tests and assets, which is about 40 PRs at 700.
Splitting further would separate a model from its tests or land half a
directory of views, and a PR of that shape cannot be reviewed against the
upstream files it mirrors. Writebook landed as one PR (trails#10716) for the
same reason.

`max-est-loc` is 2,500, the value RFCs 0185, 0212 and 0256 set. Every app
story is at or under 2,450. The JavaScript and the stylesheets, which are
copied byte for byte, are split in two each so that no story needs more than
those RFCs were granted. Open question 5 asks the operator to confirm the lift.

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
  keeps every gem PR inside the LOC ceiling and leaves the app PRs with no
  stand-ins to retire later.

## Rollout

1. Gems with no new crypto, in parallel: `addressable-uri-query-values` then
   `geared-pagination-port`; `rails-autolink-port`; `useragent-port` then
   `platform-agent-port`; `surfguard-port`; `lexxy-engine-port` (after Open
   question 3); and the existing `rqrcode-port` and `jbuilder-port` (RFC 0142, both
   `draft`). Whoever promotes this RFC to `active` also runs
   `pnpm tasks status-set rqrcode-port ready` and
   `pnpm tasks status-set jbuilder-port ready` in the same step, since
   `campfire-controllers-top-level-and-concerns` depends on both.
2. Crypto: `ruby-compat-openssl-pkey-ec` and `ruby-compat-openssl-kdf-bn-asn1`,
   then `jwt-es256-encode`, then `web-push-port`.
3. App foundation: `vendor-campfire-source`, then `campfire-app-skeleton`.
4. App lib and models: `campfire-lib-rails-ext-and-restricted-http` and
   `campfire-models-rooms-memberships-accounts`, then
   `campfire-models-users-messages-push` and `campfire-models-opengraph-and-caches`,
   which depend on the lib story.
5. App surface: `campfire-channels`, `campfire-helpers`,
   `campfire-controllers-top-level-and-concerns`,
   `campfire-controllers-namespaced`, `campfire-views`,
   `campfire-jobs-web-push-and-wal-checkpoint`, `campfire-javascript-controllers`,
   `campfire-javascript-lib-and-models`, `campfire-stylesheets-a-to-l`,
   `campfire-stylesheets-m-to-z-and-images`.
6. `campfire-system-tests`.

Each story's `deps` encode this order. Phases 1 and 2 and the four copy-only stories can run in parallel.

## Verification

- Every gem story ports the gem's own test cases for the surface it ports, and
  `parity:test` credits them.
- All 107 of Campfire's Ruby test files are ported under
  `examples/campfire/test` and pass on SQLite.
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
3. **Lexxy reopen.** The 2026-11-17 ruling licenses an includer list for
   ActionText's reopen of `FormHelper` and `FormBuilder` and no other module.
   Lexxy reopens the same two modules for the same reason. Recommendation:
   widen that ruling to Lexxy's engine, as the 2026-11-10 ruling widened the
   route-set one.
4. **Package home for rqrcode and jbuilder.** Their stories sit in
   `0142-trailties-surfaced-deviations`; move them here or leave them and
   depend on them by id. Recommendation: leave them, depend by id, and promote both to `ready` when
   this RFC is promoted (Rollout phase 1).
5. **The LOC ceiling for the app stories.** Lift it to 2,500 as in § The LOC
   ceiling is lifted, split the app into about 40 ceiling-sized stories, or
   land it as one PR as Writebook did. Recommendation: lift it to 2,500, the
   value RFCs 0185, 0212 and 0256 were granted.

## Changelog

- 2026-11-27: initial RFC
- 2026-11-27: review fixes: RestrictedHTTP and controller deps added to the
  Opengraph, Push and views stories; the copy-only stories split in two so
  `max-est-loc` is 2,500, the precedent value; RFC 0142's `rqrcode-port` and
  `jbuilder-port` are promoted together with this RFC
- 2026-11-27: app split into 15 stories that each carry their tests, with the
  LOC ceiling lifted for them; useragent tied to the blocked `AllowBrowser`
  story; Lexxy's ruling scope, gem versions and test paths corrected
