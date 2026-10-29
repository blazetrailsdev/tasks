---
title: "Spike: three-way comparison for AddressListsParser (transliterate, hand-write, wrap npm)"
status: done
updated: 2026-10-29
rfc: "0204-actionmailer-and-mail-port"
cluster: mail-core
packages: ["mail"]
deps: ["vendor-mail-mini-mime-and-net-smtp"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-10-29T19:44:12Z"
assignee: "mail-address-lists-parser-spike"
blocked-by: null
---

## Context

`vendor/mail/2.8.1/lib/mail/parsers/address_lists_parser.rb` (33,242 lines) is
the largest Ragel output and the one `Mail::Address` stands on. It is generated
from `address_lists_parser.rl` (179) plus the grammars it includes:
`rfc5322.rl`, `rfc5322_address.rl`, `rfc5322_lexical_tokens.rl`,
`rfc5234_abnf_core_rules.rl`, `rfc3629_utf8.rl` and `rfc5322_date_time.rl`.
Ragel 6 has no JavaScript target. This spike decides Open question 1 for
**address lists only**, by building each option far enough to measure it:

- **A: transliterate the generated Ruby with a script.** Precedent: nokogiri's
  racc port (`packages/nokogiri/src/racc/parser.ts` plus the tables copied into
  `packages/nokogiri/src/css/parser.ts`). Unlike racc, Ragel inlines its driver
  into every generated file, so there is no shared runtime: the script emits
  tables, driver loop and action bodies per parser.
- **B: hand-write a readable TS parser** from `address_lists_parser.rl` and the
  grammars it includes. It builds the same `AddressListStruct` /
  `AddressStruct` the `.rl` actions build, so callers see the same shape.
- **C: wrap an npm parser** (`email-addresses`; nodemailer's `addressparser`)
  and adapt its output to those structs.

The repo owner leans toward B.

The comparison code is throwaway: it lives on the spike branch or in a scratch
directory, not in a mergeable PR.

## Method

The oracle is the Ruby parser itself. mail's spec suite (less the retriever
and network specs) is run with `AddressListsParser.parse` instrumented, recording
every input, the struct it returned or the error it raised, and the spec file
and example that made the call. Each option is scored against that corpus.

## Acceptance criteria

- Each option measured on:
  - **Pass rate** against the address-related specs
    (`spec/mail/parsers/address_lists_parser_spec.rb`,
    `spec/mail/elements/address_spec.rb`, `address_list_spec.rb`, and every
    other spec file whose examples parse an address), as structs equal to the
    Ruby parser's, with every failure listed and classified.
  - **Lines of code we own**, generated separated from hand-written.
  - **Bundle size** (minified, and gzip).
  - **Estimate** of the work to apply it to the other ten parsers.
- Results recorded as a table in this story or the RFC Changelog, with a
  recommendation. Open question 1 is resolved by the repo owner, not by this
  story; `mail-ragel-parsers-remaining` and the downstream stories are
  rewritten only after the ruling.
- `vendor/mail/2.8.1/lib/mail/parser_tools.rb` is ported with the winner, in
  the follow-up story the ruling creates.

## Results (2026-10-28)

The spike code is in a scratch directory and was not committed. **Corpus:** the
Ruby parser was instrumented over mail's whole spec suite, less retriever and
network specs (1,659 examples, 0 failures). That gave 1,667 calls,
**381 distinct inputs** (18 raise) from **683 examples in 32 spec files**: the
parser, `address_spec`, `address_list_spec`, `common_address_spec`, every
address field spec, `message_spec`, `header_spec` and others. An input passes
when the struct, or the error class and message, equals Ruby's exactly. A
**fuzz corpus** of 5,942 inputs, made by 1–3 byte edits of those inputs with a
fixed seed and checked against Ruby the same way, tests behaviour beyond the
specs.

|                         | A: transliterate `.rb`                                               | B: hand-written from `.rl`                       | C1: `email-addresses` 5.0.0 | C2: nodemailer `addressparser` 6.9.16 |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------------------------ | --------------------------- | ------------------------------------- |
| Spec inputs             | **381/381**                                                          | **381/381**                                      | 291/381                     | 217/381                               |
| Spec examples           | 683/683                                                              | 683/683                                          | 516/683                     | 348/683                               |
| Fuzz inputs             | **5,942/5,942**                                                      | 5,925/5,942                                      | 1,462/5,942                 | 1,009/5,942                           |
| Hand-written lines      | 112 script + 76 shared runtime                                       | 231 parser + 76 shared runtime                   | 32 adapter + 76 shared      | 24 adapter + 76 shared                |
| Generated lines         | 1,325 (tables on single lines; formatted, they are ~33k, as in Ruby) | 0                                                | 0 (npm owns ~1k)            | 0 (npm)                               |
| Bundle, min / gzip      | 980 KB / 56 KB                                                       | 7 KB / 3 KB                                      | 12 KB / 4 KB                | 4 KB / 2 KB                           |
| Readable as the grammar | no: tables plus a goto loop                                          | yes: one TS rule per `.rl` rule, actions by name | n/a                         | n/a                                   |

The 76-line shared runtime is common to all four: `ParserTools#chars`, Ruby
`strip` / `rstrip` / `unescape` / `blank?`, the structs, and the
`ParseError` family with `String#inspect` of invalid UTF-8.

**A's failures:** none. Its script was then run, unchanged in shape, over the
other ten parsers. That took six more rules (`downcase`, `id = $1 if id =~`,
`{k => v}`, the raise forms, a bare `Struct.new`, and value `a || b` as nil-or).
All ten then match Ruby on every input the suite gives them: ContentType
544/544, MessageIds 462/462, Received 168/168, DateTime 82/82,
ContentDisposition 56/56, ContentTransferEncoding 24/24, EnvelopeFrom 18/18,
MimeVersion 15/15, PhraseLists 12/12, ContentLocation 5/5. Their generated
output is about 500 KB minified (48 KB gzip).

**B's failures** are all fuzz inputs:

- 9: wrong unparsed index in the `IncompleteParseError` message.
- 4: `display_name` differs (`ミケル ,<test@ex-ample.com>`).
- 2: `local` differs across a folded line.
- 1: rejects `;`, which Ruby accepts.
- 1: wrong address count.

Every B miss, including the three fixed while building it, is one cause.
Ragel runs an action when _any_ live alternative takes the transition, and
backtracking runs only the chosen path's actions. B had to encode each such
site by hand: `angle_addr_s` on obs_angle_addr's `<`; `address_e` after `>`
at the top level but not inside a group; partial UTF-8 counted toward the
error index. Two Ruby quirks that come from this are visible to callers. In
`"a"@b.com, C <d@e>`, the second address's display name is `a`. In
`A <a@b> (c), d@e`, the comment attaches to `d@e`. B also needed possessive
runs to avoid exponential backtracking, which a DFA never pays.

**C's failures** are structural:

- No `raw`, comments or `obs_domain_list` (C2).
- `raw` and display-name rules differ from Ruby's (C1).
- Every error index is 0, and every error message differs.
- The leftover-state quirks above are absent.
- C1 rejects obsolete forms mail accepts.

An adapter cannot recover any of these, so C is not a fidelity option.

**Cost for the other ten:**

- A: done in the spike. It is the script plus a CI regeneration check
  (`mail-ragel-parsers-remaining` as written, ~150 lines of script, with the
  generated output under the LOC waiver).
- B: ~1,000 hand-written lines across ten parsers. The grammars are smaller
  (78–93 lines of `.rl` each, sharing `rfc5322*.rl`). Every parser also needs
  the same Ragel-union audit, and a fuzz differential is the only way to find
  those sites. Estimate 3–5 PRs.
- B': a TS grammar DSL over a small NFA-simulating runtime that unions actions
  per step as Ragel does. It would remove the per-site audit, but it is a
  Ragel reimplementation (~600 lines of runtime). It was not built.

**Recommendation:** choose **A** for byte-exactness. It is the only option at
100% on both corpora, and the same script already handles all eleven parsers.
Its costs are a 1 MB minified (56 KB gzip) unreadable artifact and the LOC
waiver. B is viable and readable. It is 100% on the specs and 99.7% on fuzz,
but every remaining divergence is Ragel's parallel-action semantics. The
repo owner leans toward B; if B is chosen, keep the fuzz differential in CI as
the guard. Open question 1 is left for the repo owner.
