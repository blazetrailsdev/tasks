---
title: "activesupport: close the 19 API misses in the runtime and messages files"
status: claimed
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-11-19T00:51:38Z"
assignee: "active-support-test-parallelization-threshold-unseated"
blocked-by: null
closed-reason: null
---

## Context

These are the API misses in the runtime and messages files (19 members, 16
files), from `parity:api --missing`:

| Ruby file                       | Missing                             |
| ------------------------------- | ----------------------------------- |
| `duration.rb`                   | `init_with`, `encode_with`          |
| `json/encoding.rb`              | `encode`, `dump`                    |
| `multibyte/chars.rb`            | `to_s`, `to_str`                    |
| `current_attributes.rb`         | `method_added`                      |
| `descendants_tracker.rb`        | `initialize`                        |
| `encrypted_configuration.rb`    | `message` (`InvalidKeyLengthError`) |
| `error_reporter/test_helper.rb` | `initialize`                        |
| `execution_wrapper.rb`          | `complete!`                         |
| `log_subscriber.rb`             | `initialize`                        |
| `message_encryptor.rb`          | `inspect`                           |
| `message_verifier.rb`           | `inspect`                           |
| `ordered_options.rb`            | `pretty_print`                      |
| `reloader.rb`                   | `initialize`                        |
| `time_with_zone.rb`             | `mday`                              |
| `xml_mini/nokogiri.rb`          | `to_hash`                           |
| `xml_mini/rexml.rb`             | `require_rexml`                     |

The four `initialize` rows need a constructor that matches Rails (see root
CLAUDE.md § "A module's `initialize` is inlined into the constructor").
`to_s` / `to_str` / `inspect` / `pretty_print` follow § "Ruby protocol
methods with a different JS mechanism".

## Acceptance criteria

- [ ] Each member is ported onto its Rails owner, or receipted under a named
      section.
- [ ] All 16 files reach 100% in `parity:api`.
