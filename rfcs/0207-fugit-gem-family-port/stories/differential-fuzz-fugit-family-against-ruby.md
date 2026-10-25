---
title: "Differential fuzz of raabro, chronic, et-orbi and fugit against the Ruby gems"
status: draft
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
cluster: fugit-family
packages: ["fugit", "et-orbi", "chronic", "raabro", "scripts"]
deps: ["port-fugit-package", "port-et-orbi-package", "port-chronic-package", "port-raabro-package"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The four RFC 0207 packages (`raabro`, `chronic`, `et-orbi`, `fugit`) were ported fast, starting from generator output. Their bar is the gems' own spec suites, and those suites only cover inputs the gem authors thought to write down. A shortcoming outside those examples (a parse arm that was never reached, a Float or zone formatting edge, an off-by-one in `next_time` across a DST change or a month end) passes every spec and every parity gate. The way to find these is a differential fuzz: run the same input through the vendored Ruby gem and through the TS port, then compare the results.

Ruby 3.3.11 is on `PATH`, and the vendored sources load with `-I`: `vendor/fugit/v1.11.1/lib`, `vendor/raabro/v1.4.0/lib`, `vendor/et-orbi/v1.2.11/lib`, `vendor/chronic/v0.10.2/lib`. These are the surfaces to fuzz:

- `Fugit.parse`, `Fugit.parse_cron`, `Fugit.parse_duration`, `Fugit.parse_nat`, `Fugit.parse_at` (`vendor/fugit/v1.11.1/lib/fugit/parse.rb`). Compare the class of the result, `nil` against a value, and the result's `to_s` / `to_cron_s` / `deflate.to_plain_s` / `to_h`.
- `Fugit::Cron#next_time` / `#previous_time` (`lib/fugit/cron.rb`), from fuzzed start times across zones, DST changes, leap days and month ends, compared as epoch seconds plus zone. These are the calls solid_queue's `RecurringTask` makes.
- `Fugit::Duration` arithmetic and formatting (`lib/fugit/duration.rb`), including Float and negative values and `+` with an `EtOrbi::EoTime`.
- `EtOrbi.make_time` / `EtOrbi.parse` and `EoTime#strftime` / `#to_s` / `#utc_offset` (`vendor/et-orbi/v1.2.11/lib/et-orbi`).
- `Chronic.parse` with a fixed `now:` (`vendor/chronic/v0.10.2/lib/chronic`).
- `raabro` is reached through all of the above. Where a parse tree differs, the fuzzer prints `Raabro.pp` output for both sides.

Inputs are generated from grammars (cron fields with ranges, steps, lists, `L`, `#`, and `@` shorthands, duration units, nat phrases, timestamps with zones), mutated with junk (stray whitespace, bad tokens, out-of-range values), and seeded from every literal in the gems' specs. A run is reproducible from a seed.

## Acceptance criteria

- [ ] A harness under `scripts/` (or a `fuzz` dev script per package) feeds one batch of inputs to a Ruby driver script that loads the vendored gems, and to the TS packages. It diffs normalized JSON results and errors: the error class on the Ruby side against the ported error class on the TS side.
- [ ] Run it for at least 10,000 inputs per surface listed above, with a recorded seed. For each distinct divergence, either fix it in this PR (when it is small, and adding a regression test that fails on the old code) or file a story in this RFC, with the minimal input, both outputs, and the Rails-gem `file:line` of the arm that differs.
- [ ] Divergences that come from a ratified trails CLAUDE.md limit (for example Float formatting covered by an existing ruling, or the zone database) are listed in the PR body with the section they fall under. They are not filed.
- [ ] The minimal reproducing inputs are added as vitest cases in each package's trails-only test file (not the ported spec files), with Ruby's answer as the expected value.
- [ ] The PR body says how to re-run the harness. It is not wired into CI by this story.
