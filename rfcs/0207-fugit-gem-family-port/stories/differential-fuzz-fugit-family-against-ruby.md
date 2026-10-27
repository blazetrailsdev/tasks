---
title: "Differential fuzz of raabro, chronic, et-orbi and fugit against the Ruby gems"
status: done
updated: 2026-10-27
rfc: "0207-fugit-gem-family-port"
cluster: fugit-family
packages: ["fugit", "et-orbi", "chronic", "raabro", "scripts"]
deps: ["port-fugit-package", "port-et-orbi-package", "port-chronic-package", "port-raabro-package"]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9316
claim: "2026-10-25T23:24:49Z"
assignee: "differential-fuzz-fugit-family-against-ruby"
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

Inputs are generated from grammars (cron fields with ranges, steps, lists, `L`, `#`, and `@` shorthands, duration units, nat phrases, timestamps with zones), mutated with junk (stray whitespace, bad tokens, out-of-range values), and seeded from every literal in the gems' specs and from the real-world corpus below. A run is reproducible from a seed.

## Real-world seed corpus

Gathered 2026-10-25 from two sources and kept only where vendored fugit 1.11.1 parses the input (`Fugit.parse` returns non-nil). The left column is the result class Ruby returns; the input starts at column 11.

- Inputs quoted in floraison/fugit issues that were closed as completed on or before 2024-08-15, the 1.11.1 release date. Open issues, issues closed as not planned, and issues fixed after 1.11.1 are excluded, because 1.11.1 still has those bugs and the fuzz should not reproduce broken behavior.
- `schedule:` / `cron:` values in public GitHub `recurring.yml` (solid_queue), `schedule.yml` / `sidekiq_cron.yml` (sidekiq-cron) and good_job configs, plus string literals passed to `Fugit.parse`, `Fugit::Cron.parse` and `Fugit::Nat.parse` in public Ruby code.

The harness loads this list as fixed seeds that run before the generated inputs.

```text
Cron      * * * * *
Cron      * * * * * *
Cron      0 * * * *
Cron      0 0
Cron      0 0 * * *
Cron      0 0 * * 0
Cron      0 0 0 * * *
Duration  +0000
Cron      0 0 * * 1
Cron      0 0 */1 * *
Cron      0 0 1 * *
Cron      0 0/1 * * *
Cron      0 0 */10 * *
Cron      0 0 */11 * *
Cron      0 0 1 1 *
Cron      0 0 11 11 *
Cron      0 0 11 11 0-7
Cron      0 0 11 11-12 3-6
Cron      0 0 11 11 3-6
Cron      0 0 11-13 11 3-6
Cron      0 0 11 * 3-6
Cron      0 0 1,15 * *
Cron      0 0 1 1 * UTC
Cron      0 0 */12 * *
Cron      0 0,12 * * *
Cron      0 0 */13 * *
Cron      0 0 */14 * *
Cron      0 0 */15 * *
Cron      00 15 * 1-5,9-12 FRI
Cron      0 0 */16 * *
Cron      00 16 * * *
Cron      0 0 */17 * *
Cron      0 0 */18 * *
Cron      00 18 * * *
Cron      0 0 */19 * *
Cron      0 0/1 * * * Asia/Tokyo
Cron      0 0 */2 * *
Cron      0 0 */20 * *
Cron      0 0 */21 * *
Cron      0 0 */2 * 1-5
Cron      0 0 */22 * *
Cron      00 22 * * *
Cron      0 0 */23 * *
Cron      0 0 23 * * *
Cron      00 23 * * *
Cron      00 23 * * 1-5
Cron      0 0 */24 * *
Cron      0 0 */25 * *
Cron      0 0 */26 * *
Cron      0 0 */27 * *
Cron      0 0 */28 * *
Cron      0 0 */29 * *
Cron      0 0 29 2 *
Cron      0 0 29 2 0,6
Cron      0 0 29 2 0-7
Cron      0 0 */2 * * Europe/Berlin
Cron      0 0 */3 * *
Cron      0 0 */30 * *
Cron      0 0 */4 * *
Cron      0 0 */5 * *
Cron      0 0 -5 * *
Cron      0 05 * * *
Cron      00 5 * * 1-5
Cron      0 0 * * 6
Cron      0 0 */6 * *
Cron      0 0 */7 * *
Cron      0 0 7-10 11 3-6
Cron      0 0 */8 * *
Cron      0 0 */9 * *
Cron      0 0 * * * America/New_York
Cron      0 0 * * * America/Santiago
Cron      0 0 * * * PST8PDT
Cron      0 0 * *  sun
Cron      0 0 * * tue/2
Cron      0 */1 * * *
Cron      0 1 * * *
Cron      0 10 * * *
Duration  +0100
Cron      0 10 * * 1
Cron      0/10 9,10,11,12,13,14,15,16,17,18 * * * Europe/Paris
Cron      0 11 * * *
Cron      0 11 1 * *
Cron      0 */12 * * *
Cron      0 1 * * 2
Cron      0 12 * * *
Cron      0 12 */1 * *
Cron      0 12,13 * * *
Cron      0 12 4 11 *
Cron      0 12 * * 5
Cron      0 12 * * mon#2
Cron      0 13 * * *
Cron      0 13 * * 1-5
Cron      0 13 * * wed%2
Cron      0 14 * * *
Cron      0 14 * * 1-5
Cron      0 1 * * 5
Cron      0 15 * * *
Cron      0 15 * * 1
Cron      0,15 18,19 * * * UTC
Cron      0,15 18 * * * UTC
Cron      0 15 * * 2
Cron      0,15,30,45 * * * *
Cron      0 15 * * 5
Cron      0 15 * * 6
Cron      0 16 * * *
Cron      0 16 30 9 *
Cron      0 16 31 10 *
Cron      0 16 * * 5
Cron      0 16 * * 6
Cron      0 17 * * *
Cron      0 18,19 * * * UTC
Cron      0 18 * * * UTC
Cron      0 19 * * 6
Cron      0 */1 * * * America/New_York
Cron      0 */1 * * * Asia/Tokyo
Cron      0 1 * * * UTC
Cron      0 */2 * * *
Cron      0 2 * * *
Cron      0 2 * * 0
Cron      0 20 * * *
Duration  +0200
Cron      0 22 14 * *
Cron      0 2 * * 2-6
Cron      0 23 * * *
Cron      0 23 * * 1-5
Cron      0 2 * * 3 Asia/Jerusalem
Cron      * 0-24 * * *
Cron      0 24 * * *
Cron      0 */2 * * * America/New_York
Cron      0 */3 * * *
Cron      0 3 * * *
Cron      0 3 * * 0
Cron      0,30 * * * *
Duration  +0300
Cron      0,30 9-15 * * 1-5
Cron      0 3 * * 1
Cron      0 3 */1 * *
Cron      0 3 1 * *
Cron      0 3 */3 * *
Cron      0 */3 * * * America/New_York
Duration  -04
Cron      0 */4 * * *
Cron      0 4 * * *
Duration  -0400
Cron      0 4,14 * * *
Cron      0 4 * * 1-5
Cron      0 4 * * 6
Cron      0 */48 * * *
Cron      0 * * * 5
Cron      0 */5 * * *
Cron      0 5 * * *
Cron      0,5,10,15,20,25,30,35,40,45,50,55 * * * *
Cron      0 5 * * 2%6 Europe/Berlin
Duration  +0530
Cron      0 5 * * 6
Cron      0 5 * * mon#1
Cron      0 */6 * * *
Cron      0 6 * * *
Cron      0 6 * * 1-5
Cron      0 */6 * * * America/Vancouver
Cron      0 6 * * * Europe/Berlin
Cron      0 7 * * *
Cron      0 7 * * 0
Duration  -0700
Cron      0 7 * * 1-5
Cron      0 7 * * 1 America/Tegucigalpa
Cron      0 7 * * 2%2 America/Bogota
Cron      07 3,11,15 * * *
Cron      0 */8 * * *
Cron      0 8 * * *
Duration  -0800
Cron      0 8 * * 1%2+2
Cron      0 8 15 * *
Cron      0 8-19/4 * * *
Cron      0 8 L * mon-thu
Cron      0 8 L * mon-thu Europe/Berlin
Cron      0 9 * * *
Duration  +0900
Cron      0 9 * * 1
Cron      0 9 * * 1-5
Cron      0 9 -2 * *
Cron      0 9 29 feb *
Cron      0 9 -2 * * Europe/Berlin
Cron      0 9 * * * Europe/Madrid
Cron      0 9 * * MON
Cron      0 * * * * Asia/Tokyo
Cron      * 0 * * mon
Cron      */1 * * * *
Cron      1 * * * *
Cron      */10 * * * *
Cron      */10 * * * * *
Cron      1 0 * * *
Cron      10 * * * *
Cron      10 * * * * *
Cron      10 0 * * *
Duration  +1000
Cron      1 0 1 * *
Cron      10 1 * * *
Cron      10-40 22 * * mon-fri
Cron      10 5 * * *
Cron      10 8 * * mon Europe/Berlin
Cron      1 0 * * * America/Vancouver
Cron      1 1 * * * America/New_York
Cron      1 2 3 4 5 6
Cron      1 2 * * * America/New_York
Cron      */15 * * * *
Cron      15 * * * *
Cron      15 0 * * *
Cron      15 1 * * *
Cron      15 12 * * *
Cron      15 18 * * *
Cron      15 2 * * *
Cron      15,45 9-15 * * 1-5
Cron      17 3 * * *
Cron      17 4 * * * UTC
Cron      17 */6 * * *
Cron      19 14 * * *
Duration  1 day
Cron      */2 * * * *
Cron      20 0 * * 2%4 Etc/UTC
Cron      20 0 * * 2%4 Europe/London
Cron      */20 21-23,0-15 * * *
Cron      20 9 * * 2%4 Australia/Melbourne
Cron      21 0 * * 1%2 America/Sao_Paulo
Cron      2,12,22,32,42,52 * * * *
Cron      22 2 * * *
Cron      23 * * * *
Cron      * */24 * * *
Cron      25 2 * * 4
Cron      29 9 16 * * Etc/GMT-11
Cron      */3 * * * *
Cron      */30 * * * *
Cron      */30 * * * * *
Cron      30 * * * *
Cron      30 0 * * *
Cron      30 06 * * *
Cron      30 1 * * *
Cron      30 10 * * 3
Cron      30 10 * * 4
Cron      30 12 * * *
Cron      30 12 * * WED
Cron      30 14 * * *
Cron      30 14 * * 4%4+3 Australia/Melbourne
Cron      30 16 * * 1-5
Cron      30 16 * * MON
Cron      30 18 * * *
Cron      30 2 * * *
Cron      30 2 * * 0
Cron      30 20 * * *
Cron      30 21 * * *
Cron      30 */3 * * *
Cron      30 4 * * *
Cron      30 6 * * *
Cron      30 7 * * *
Cron      30 7 * * 6
Cron      30 8 * * *
Cron      30 8 * * 1 America/Vancouver
Cron      32 1 * * 1
Cron      3 3 * * *
Cron      35 * * * *
Cron      37 6 * * *
Cron      40 1 * * *
Cron      40 3 * * *
Cron      42 2 * * 0-5
Cron      42 2 * * 6
Cron      43 10 * * 1
Cron      45 14 21 * *
Cron      45 3 * * 1-5
Cron       45 5 * * sun
Cron      45 5 * * sun
Cron      */5 * * * *
Cron      */5 * * * * *
Cron      5 * * * *
Cron      5 * * * * *
Cron      5 0 * * *
Cron      50 * * * *
Cron      50 0,12 * * *
Cron      50 */12 * * *
Cron      55 23 * * *
Cron      55 23,3,7,11 * * *
Cron      55 6 * * 2#1 America/Los_Angeles
Cron      59 23 * * 1
Cron      59 6 1-7 * 2
Duration  5 minutes
Cron      7 0 * * *
Cron      * 8 * * *
Duration  809
Cron      * 8-17 * * 1-5
Cron      at 12:00 PM
Cron      at 12:05am every day
Cron      at 1am every day
Cron      at 2:03am every day
Cron      at 3:30am every day
Cron      at 3:45am every day
Cron      at 3am every day
Cron      at 4:06am every day
Cron      at 4am every day
Cron      at 5am every day
Cron      at 8am every day
Cron      at midnight every day
Cron      CET
Cron      @daily
Cron      every 10 minutes
Cron      every 12 hours at minute 50
Cron      every 15 minutes
Cron      every 15s
Cron      every 17 hours
Cron      every 1 day at 3am
Cron      every 1 hour
Cron      every 1 minute
Cron      every 27 hours
Cron      every 2 hours
Cron      every 2 minutes
Cron      Every 2nd of the month at 10:00
Cron      every 30 minutes
Cron      every 3 minutes
Cron      every 40 minutes
Cron      every 4 hours
Cron      every 5m
Cron      every 5 minutes
Cron      every day
Cron      every day at 00:01 UTC
Cron      every day at 02:30
Cron      every day at 03:15
Cron      every day at 08:30
Cron      every day at 08:30 pm
Cron      every day at 0am
Cron      every day at 10:00am
Cron      every day at 11am
Cron      every day at 12:00am
Cron      every day at 12:15 am
Cron      every day at 12:15 pm
Cron      every day at 12:32am
Cron      every day at 12 am on America/Sao_Paulo
Cron      every day at 12am UTC
Cron      every day at 18:00 and 18:15 and 19:00 and 19:15 UTC
Cron      every day at 18:00 and 18:15 UTC
Cron      every day at 18:00 and 19:00 UTC
Cron      every day at 18:00 and 20:00 UTC
Cron      every day at 1am
Cron      every day at 1am EST
Cron      every day at 2:00am
Cron      every day at 2:30am Europe/London
Cron      every day at 2 am
Cron      every day at 2am
Cron      every day at 2am Europe/London
Cron      every day at 3:00 am
Cron      every day at 3:00am
Cron      every day at 3am
Cron      every day at 4am
Cron      every day at 4am UTC
Cron      every day at 5:00pm
Cron      every day at 6:00 and 18:00 on UTC
Cron      every day at 6am
Cron      every day at 6pm and 8pm UTC
Cron      every day at 7:00 and 21:00
Cron      every day at 7:42am
Cron      every day at 8:30
Cron      every day at 8:30 pm
Cron      every day at 9am
Cron      every day at 9am in America/Los_Angeles
Cron      every day at midnight
Cron      every Fri,Sat,Sun at 18:00 UTC
Cron      every Fri-Sun at 18:00 UTC
Cron      every hour
Cron      every hour at minute 0
Cron      every hour at minute 1
Cron      every hour at minute 12
Cron      every hour at minute 20
Cron      every hour at minute 22
Cron      every hour at minute 23
Cron      every hour at minute 27
Cron      every hour at minute 42
Cron      every hour at minute 7
Cron      every minute
Cron      every monday at 10am on America/Los_Angeles
Cron      every monday at 1am
Cron      every monday at 2am
Cron      every monday at 3:15am
Cron      every monday at 3am
Cron      every monday at 9am
Cron      every Monday at 9am
Cron      every monday at 9am America/New_York
Cron      every monday at midnight
Cron      every month at 9am, Australia/Adelaide
Cron      every sunday at 22:00
Cron      every Thursday at 5am America/Sao_Paulo
Cron      every Tuesday at 10am in America/Los_Angeles
Cron      every tuesday at 10am on America/Los_Angeles
Cron      every weekday 8am to 5pm
Cron      @hourly
Cron      MST
Duration  P-2M
Duration  P2M
Duration  P-72d
Cron      PST8PDT
Cron      UTC
```

## Acceptance criteria

- [ ] A harness under `scripts/` (or a `fuzz` dev script per package) feeds one batch of inputs to a Ruby driver script that loads the vendored gems, and to the TS packages. It diffs normalized JSON results and errors: the error class on the Ruby side against the ported error class on the TS side.
- [ ] Run it for at least 10,000 inputs per surface listed above, with a recorded seed. For each distinct divergence, either fix it in this PR (when it is small, and adding a regression test that fails on the old code) or file a story in this RFC, with the minimal input, both outputs, and the Rails-gem `file:line` of the arm that differs.
- [ ] Divergences that come from a ratified trails CLAUDE.md limit (for example Float formatting covered by an existing ruling, or the zone database) are listed in the PR body with the section they fall under. They are not filed.
- [ ] Every input in the seed corpus above agrees between Ruby and TS on the result class, `to_cron_s` / `deflate.to_plain_s`, and the next and previous five fire times from three fixed start times in UTC, `America/New_York` and `Europe/Berlin`.
- [ ] The minimal reproducing inputs are added as vitest cases in each package's trails-only test file (not the ported spec files), with Ruby's answer as the expected value.
- [ ] The PR body says how to re-run the harness. It is not wired into CI by this story.
