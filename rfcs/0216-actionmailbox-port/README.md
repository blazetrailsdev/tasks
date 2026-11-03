---
rfc: "0216-actionmailbox-port"
title: "Port ActionMailbox, core and the Relay ingress first"
status: draft
created: 2026-11-03
updated: 2026-11-03
owner: "@deanmarano"
packages:
  - actionmailbox
  - ruby-compat
  - trailties
clusters:
  - amb-infra
  - amb-core
  - amb-ingress
  - amb-engine
  - amb-ingress-deferred
---

# RFC 0216 — Port ActionMailbox, core and the Relay ingress first

## Summary

Port `vendor/rails/v8.0.2/actionmailbox` (`lib/`, `app/`, `config/`, `db/`;
1,740 lines across 53 files, 105 tests in 24 files) to a new
`packages/actionmailbox`. The first wave is the core: `Base`, `Callbacks`,
`Router` and `Routing`, the `InboundEmail` model with its message-id,
routing and incineration concerns, both jobs, the `mail_ext` reopenings of
`Mail`, `Relayer`, `TestHelper` / `TestCase`, the engine and its routes, the
Relay ingress, the ingress rake tasks, the generators and the conductor. The
Mailgun, Mandrill, Postmark and SendGrid ingresses are filed as a deferred
second wave (repo-owner ruling, 2026-11-03).

## Motivation

ActionMailbox is one of the two Rails gems with no RFC. Its gemspec depends
on activesupport, activerecord, activestorage, activejob, actionpack and
`mail` (`actionmailbox.gemspec`), and every one of those now has a trails
package: `mail` and `net-smtp` under RFC 0204, activestorage under RFC 0209,
activejob under RFC 0169. Three open threads elsewhere wait on it:

- RFC 0204's Non-goals say "ActionMailbox: its own RFC".
- RFC 0212's Non-goals leave "ActionMailbox and ActionText railties pieces
  (`rails/all.rb` requires, their generator hooks)" with no owner, because no
  package existed. `packages/trailties/src/all.ts:27` already requires
  `action_mailbox/engine` and swallows the `LoadError`; this RFC supplies the
  module behind it (`actionmailbox-engine-routes-and-trailties-wiring`).
- `configuration-test-framework-deprecators` (RFC 0123) is blocked in part on
  `ActionMailbox.deprecator` (`railties/test/application/configuration_test.rb:4273`).

Shape of the gem:

| Part                                  | Files | Lines | Tests | Wave     |
| ------------------------------------- | ----- | ----- | ----- | -------- |
| `lib/action_mailbox` core             | 18    | 548   | 46    | first    |
| `app/models`, `app/jobs`, `db`        | 9     | 233   | 17    | first    |
| `app/controllers` base + relay        | 2     | 103   | 7     | first    |
| conductor (controllers, views)        | 11    | 207   | 4     | first    |
| `config/routes.rb`, engine            | 2     | 66    | —     | first    |
| generators, `lib/tasks`               | 10    | 193   | 6     | first    |
| Mailgun, Mandrill, Postmark, SendGrid | 4     | 335   | 25    | deferred |

## Design

### Package layout and parity

`packages/actionmailbox` is a workspace package depending on activesupport,
activerecord, activestorage, activejob, actionpack, trailties and mail, as the
gemspec does. Its `vendor/sources.ts` entry follows `packages/activestorage`
(`activestorage-parity-enrollment-and-package`): `libPath: "lib"` plus
`extraLibPaths` for `app/models/action_mailbox`, `app/jobs/action_mailbox`,
`app/controllers/action_mailbox` and `app/controllers/rails/conductor`, with
`compareApi` and `compareTests` on from the first PR. The four deferred
ingress controllers are unported rows that are **not** `PERMANENT`: they
converge in the second wave.

### `mail_ext` reopens `Mail` classes from another package

`lib/action_mailbox/mail_ext/*.rb` reopen `Mail::Address` (`==`, `self.wrap`),
`Mail::Message` (`from_address`, `recipients`, `recipients_addresses`, the
`*_addresses` readers, private `address_list`) and the `Mail` module
(`from_source`). The definitions stay in actionmailbox's files at their Rails
paths (`src/mail-ext/addresses.ts`, …), written as `this`-typed functions
assigned onto `Mail.Message.prototype` / `Mail.Address` when the module loads
(CLAUDE.md § "Module mixins", "One method, no module"), with a
`declare module "@blazetrails/mail"` interface merge for their types. They
are never moved into `packages/mail`, which would credit them to the wrong
gem. `Address#==` ports as `eql` / the `rbEqual` hook ruby-compat dispatches
to (CLAUDE.md § "Ruby protocol methods with a different JS mechanism"). Open
question 3 asks the owner to ratify the reopening shape.

### Reading the raw email is async; everything downstream of it is async

`InboundEmail#source` is `raw_email.download`
(`app/models/action_mailbox/inbound_email.rb:37-39`), and ActiveStorage's
`download` is I/O and async in trails. `mail` memoizes
`Mail.from_source(source)` (`:33-35`). So `source` and `mail` are `async`, at
their Rails names, and so is every reader of them: `Router::Route#match?`
(`lib/action_mailbox/router/route.rb:16-29`) for the String and Regexp arms,
`Router#route` / `#mailbox_for`, `Base.receive`, `#perform_processing` and
the `:process` callback run. `create_and_extract_message_id!`
(`inbound_email/message_id.rb:16-24`) is `create!` plus a blob upload, so it
is async too. This follows CLAUDE.md § "A job's `perform` and `enqueue` are
async": every consumer is already a job body or a controller action. A
`Proc` / matchable address that reads `inbound_email.mail` awaits it. Open
question 1 records the alternative.

### Constants Rails resolves at call time

`Routable#route` is `ApplicationMailbox.route self`
(`inbound_email/routable.rb:21-23`): an application constant, read at call
time off `TopLevel` (`TopLevel.ApplicationMailbox!.route(this)`), seated by
the application loader. `Router::Route#mailbox_class` is
`"#{mailbox_name.to_s.camelize}Mailbox".constantize` (`route.rb:31-33`): a
computed name, so it is `constantize`, which walks `TopLevel` (CLAUDE.md
§ "Constant lookup is an import or a registry"). No mailbox registry is
invented.

### The Relay ingress and `Net::HTTP`

`ActionMailbox::Relayer` (`lib/action_mailbox/relayer.rb`) posts through
`Net::HTTP` (`:54-72`) and branches on `Net::HTTPSuccess` /
`Net::HTTPUnauthorized` (`:37-43`). `net/http` is Ruby stdlib
(`vendor/ruby/v3.3.11/lib/net/http.rb`), so the client surface the relayer
calls is ported into ruby-compat beside `uri`, at Ruby's names, over
`node:http` / `node:https`: `ruby-compat-net-http-post-client`. `relay` is
async. Only what Relayer calls is ported (ruby-compat README rule 1).

### Tests

ActionMailbox's suite boots `test/dummy` (`test/test_helper.rb:8`). The
port's tests run against the canonical activerecord adapter lanes with the
`action_mailbox_inbound_emails` and ActiveStorage tables laid by the gem's own
migration, as activestorage's suite does
(`activestorage-migrations-and-test-database`). `test/fixtures/files/*.eml`
are copied verbatim. The relayer test's WebMock calls (`stub_request`,
`assert_requested`) are Open question 2.

## Non-goals

- **Mailgun, Mandrill, Postmark and SendGrid ingresses** in the first wave:
  owner ruling, 2026-11-03. They are filed (`actionmailbox-mailgun-ingress`,
  `actionmailbox-mandrill-ingress`, `actionmailbox-postmark-ingress`,
  `actionmailbox-sendgrid-ingress`) in cluster `amb-ingress-deferred`, and
  their `config/routes.rb:5,7-14` routes are drawn by the story that ports
  each controller.
- **A WebMock port** as a package: see Open question 2.
- **ActionText**: its own RFC.

## Alternatives considered

- **`mail_ext` methods moved into `packages/mail`.** Rejected: they are
  ActionMailbox's, and `parity:api` would credit them to the `mail` gem.
- **A sync `InboundEmail#mail` over a prewarmed `source`** (the `Attached::One`
  shape: an explicit `load` before routing, a raise on an unloaded read).
  Recorded as Open question 1; not recommended, because user mailbox code
  reads `mail` inside `process`, which is already async.
- **`fetch` instead of a ported `Net::HTTP`.** Rejected: Relayer's body
  branches on `Net::HTTP` response classes and rescues
  `IOError, SocketError, SystemCallError` / `Timeout::Error` (`relayer.rb:45-50`),
  which a `fetch` rejection does not raise.

## Rollout

Every file under `lib/`, `app/`, `config/` and `db/` has an owning story.

1. Infra: `actionmailbox-package-and-parity-enrollment`,
   `ruby-compat-net-http-post-client`
2. Leaves: `actionmailbox-mail-ext`, `actionmailbox-relayer`
3. Model: `actionmailbox-record-inbound-email-message-id-and-routable` →
   `actionmailbox-test-helper-and-test-case`
4. Core: `actionmailbox-router-route-and-routing` →
   `actionmailbox-base-and-callbacks` →
   `actionmailbox-incineration-and-inbound-email-tests`,
   `actionmailbox-bouncing-test`
5. Engine and ingress: `actionmailbox-engine-routes-and-trailties-wiring` →
   `actionmailbox-base-controller-and-relay-ingress`,
   `actionmailbox-ingress-rake-tasks`,
   `actionmailbox-generators-and-install`, `actionmailbox-conductor`
6. Deferred: `actionmailbox-mailgun-ingress`,
   `actionmailbox-mandrill-ingress`, `actionmailbox-postmark-ingress`,
   `actionmailbox-sendgrid-ingress`

File map:

| Rails file                                                                                                                                                                                                                   | Story                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `lib/action_mailbox.rb`, `version.rb`, `gem_version.rb`, `deprecator.rb`                                                                                                                                                     | `actionmailbox-package-and-parity-enrollment`                |
| `lib/action_mailbox/mail_ext.rb`, `mail_ext/*.rb` (5)                                                                                                                                                                        | `actionmailbox-mail-ext`                                     |
| `lib/action_mailbox/relayer.rb`                                                                                                                                                                                              | `actionmailbox-relayer`                                      |
| `app/models/action_mailbox/record.rb`, `inbound_email.rb`, `inbound_email/message_id.rb`, `inbound_email/routable.rb`, `app/jobs/action_mailbox/routing_job.rb`, `db/migrate/20180917164000_create_action_mailbox_tables.rb` | `actionmailbox-record-inbound-email-message-id-and-routable` |
| `lib/action_mailbox/test_helper.rb`, `test_case.rb`                                                                                                                                                                          | `actionmailbox-test-helper-and-test-case`                    |
| `lib/action_mailbox/router.rb`, `router/route.rb`, `routing.rb`                                                                                                                                                              | `actionmailbox-router-route-and-routing`                     |
| `lib/action_mailbox/base.rb`, `callbacks.rb`                                                                                                                                                                                 | `actionmailbox-base-and-callbacks`                           |
| `app/models/action_mailbox/inbound_email/incineratable.rb`, `incineratable/incineration.rb`, `app/jobs/action_mailbox/incineration_job.rb`                                                                                   | `actionmailbox-incineration-and-inbound-email-tests`         |
| `lib/action_mailbox/engine.rb`, `config/routes.rb` (relay, conductor routes)                                                                                                                                                 | `actionmailbox-engine-routes-and-trailties-wiring`           |
| `app/controllers/action_mailbox/base_controller.rb`, `ingresses/relay/inbound_emails_controller.rb`                                                                                                                          | `actionmailbox-base-controller-and-relay-ingress`            |
| `lib/tasks/ingress.rake`                                                                                                                                                                                                     | `actionmailbox-ingress-rake-tasks`                           |
| `lib/tasks/install.rake`, `lib/generators/action_mailbox/install/install_generator.rb`, `lib/rails/generators/mailbox/**`, `lib/rails/generators/test_unit/**`                                                               | `actionmailbox-generators-and-install`                       |
| `app/controllers/rails/conductor/**` (5), `app/views/layouts/rails/conductor.html.erb`, `app/views/rails/conductor/action_mailbox/**` (4)                                                                                    | `actionmailbox-conductor`                                    |
| `app/controllers/action_mailbox/ingresses/mailgun/…`                                                                                                                                                                         | `actionmailbox-mailgun-ingress` (deferred)                   |
| `app/controllers/action_mailbox/ingresses/mandrill/…`                                                                                                                                                                        | `actionmailbox-mandrill-ingress` (deferred)                  |
| `app/controllers/action_mailbox/ingresses/postmark/…`                                                                                                                                                                        | `actionmailbox-postmark-ingress` (deferred)                  |
| `app/controllers/action_mailbox/ingresses/sendgrid/…`                                                                                                                                                                        | `actionmailbox-sendgrid-ingress` (deferred)                  |

## Verification

- All 105 ActionMailbox tests are ported: 80 pass after the first wave, and
  the 25 deferred ingress-controller tests stay unported (not `PERMANENT`)
  until their stories land. Any other skip is a `PERMANENT-SKIP:` citing a
  ruling. Also ported here: railties' 3
  `action_mailbox_install_generator_test.rb` tests and 12 ActionMailbox cases
  of `railties/test/application/configuration_test.rb:3664-3772,4273`.
- `parity:api` and `parity:test` report `actionmailbox`; after the first wave
  the only unported lib/app rows are the four deferred ingress controllers.
- A booted app that imports `@blazetrails/trailties/all` loads
  `ActionMailbox::Engine`, and a message relayed by
  `trails action_mailbox:ingress:postfix` reaches a mailbox's `process`.

## Open questions

1. **Is `InboundEmail#mail` async?** (A) `source` and `mail` are async and
   every reader awaits them (recommended; Design). (B) `source` is loaded by
   an explicit awaited step before routing and `mail` is sync, raising on an
   unloaded read, as `Attached::One` is (CLAUDE.md § "Ruby protocol methods
   with a different JS mechanism"). B keeps `mail.subject` sync in user code
   at the cost of an invented load step.
2. **How the relayer test stubs HTTP.** `test/unit/relayer_test.rb` uses
   WebMock's `stub_request` / `assert_requested`. (A) An in-process
   `node:http` server per test, assertions on the request it recorded,
   ported assertion by assertion (recommended; no new package). (B) Port the
   slice of WebMock the test calls as a test-support package. The story
   assumes A.
3. **The `mail_ext` reopening shape** (Design): `this`-typed functions
   assigned onto `@blazetrails/mail`'s classes from actionmailbox's own files,
   with a `declare module` merge. Ratify, or name the precedent to follow.

## Changelog

- 2026-11-03: initial draft
