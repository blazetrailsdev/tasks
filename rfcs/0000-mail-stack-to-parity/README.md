---
rfc: "0000-mail-stack-to-parity"
title: "Mail stack to parity: mail, actionmailer and net-smtp"
status: active
created: 2026-11-09
updated: 2026-11-09
owner: "@deanmarano"
packages:
  - "mail"
  - "actionmailer"
  - "net-smtp"
clusters: []
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Mail stack to parity: mail, actionmailer and net-smtp

## Summary

Take the mail gem, ActionMailer and net-smtp from where the closed
`0204-actionmailer-and-mail-port` left them to full `parity:api` and
`parity:test` coverage.

## Motivation

`pnpm parity:api` / `pnpm parity:test` on 2026-11-09 (fresh build):

| Package      | api        | tests                 |
| ------------ | ---------- | --------------------- |
| mail         | 805 / 1277 | 1205 / 1639           |
| actionmailer | 224 / 230  | 205 / 258             |
| net-smtp     | 106 / 106  | 0 / 95 (73 misplaced) |

Most of mail's api gap (~330 of 472 rows) is the extractor not crediting the
`Mail` object-literal module and the Ragel parser tables, which exist. The rest
is unported files: `check_delivery_params.rb`, the four retriever methods, the
RSpec matchers and `multibyte/unicode.rb`'s database surface. The test gap is
twelve unported spec files plus ~150 examples in `message_spec.rb`,
`encodings_spec.rb`, `utilities_spec.rb` and the field specs. net-smtp's 0/95 is
mostly a path problem.

## Design

One story per Ruby file or spec cluster, each under the 700 LOC ceiling.
The api-credit story lands first so the remaining missing rows are real.

Prior art checked: `0204-actionmailer-and-mail-port` is closed with every story
done or closed; open neighbours are referenced, not re-filed:
`enumerator-map-and-singleton-for-mail` (0154, `Configuration` includes
`Singleton`), `stub-any-instance-does-not-intercept-js-new` (owns the two
skipped `delivery_methods_test.rb` tests),
`actionmailer-base-url-for-default-url-options-typed` (0142) and
`passwords-mailer-resolves-against-a-ported-actionmailer` (0142).

## Non-goals

- **A `Net::POP3` / `Net::IMAP` client.** The retrievers are ported against the
  gem's call surface and tested over the spec's `MockPOP3` / `MockIMAP`; a real
  stdlib client port is its own RFC if an application ever needs one.
- **Skipped tests already marked `PERMANENT-SKIP`** (6 in mail).

## Alternatives considered

- **Scoped-skip the Ragel tables in `conventions.ts`.** Rejected: the tables are
  ported; crediting them is the honest number.

## Rollout

1. `mail-parity-api-credits-object-literal-modules`, `net-smtp-tests-at-convention-paths`
2. Port gaps: `mail-check-delivery-params`, `mail-retriever-base-and-test-retriever`,
   `mail-retriever-pop3`, `mail-retriever-imap`, `mail-matchers-has-sent-mail-and-attachments`,
   `mail-multibyte-unicode-and-chars-bang-strips`, `mail-utilities-and-small-surface-remainder`,
   `actionmailer-api-remainder-and-mailer-method-false-tests`
3. Spec ports: `mail-mime-messages-and-example-emails-specs`,
   `mail-encoding-and-round-tripping-specs`,
   `mail-message-spec-remainder-initialization-and-output`,
   `mail-message-spec-remainder-required-fields-deliver-replying`,
   `mail-network-and-multipart-report-specs`, `mail-field-and-config-specs-remainder`,
   `mail-smtp-verify-none-and-sendmail-specs`, `actionmailer-caching-test`,
   `actionmailer-mail-helper-and-mail-layout-tests`,
   `actionmailer-callbacks-log-subscriber-url-and-small-tests`,
   `net-smtp-sslcontext-and-starttls-tests`

## Verification

`pnpm parity:api`: mail 1277/1277, actionmailer 230/230. `pnpm parity:test`:
mail, actionmailer and net-smtp each 100% matched, with only `PERMANENT-SKIP`
skips and 0 misplaced.

## Open questions

1. **How do the retrievers reach `Net::POP3` / `Net::IMAP` with no stdlib port?**
   Resolved: by the constant the gem names, resolved at call time and stubbed
   by the spec doubles; a real client is a Non-goal.
2. **Do the RSpec matchers port at all?** Resolved: yes, as plain classes at
   their Ruby names; they are public gem API, and RSpec's protocol methods are
   ordinary methods.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
