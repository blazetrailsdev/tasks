---
title: "gate-trace.sh inverts its gates on a large diff (EPIPE + pipefail)"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7132 fixed a latent CI bug: `.github/workflows/ci.yml`'s changed-path
gates computed with `echo "$files" | grep -q …` under `set -o pipefail`.
`grep -q` exits on its first match, so on a large diff `echo` is still writing
when the reader vanishes and takes **EPIPE**; `pipefail` then reports the
pipeline as failed _because the regex matched_, and the gate silently inverts
to false.

Measured on that PR's own diff:

```text
files: 756 paths, 45489 bytes
PIPE form -> gate=FALSE   <-- WRONG   (echo "$files" | grep -qE …)
HERE form -> gate=TRUE                (grep -qE … <<<"$files")
```

Run 33115534665 went green with **Unit Tests and every Active Record lane
skipped**. The checkmark was meaningless, and nothing in the run said so — the
`CI` aggregator's "unexpectedly skipped job" check reads the same inverted
gates, so it agreed the skips were expected.

`ci.yml` was fixed at all seven sites. **`scripts/ci/gate-trace.sh:42` was
missed and still carries it:**

```sh
if echo "$infra_files" | grep -qE "$INFRA_RE" || echo "$subject" | grep -qE "$re"; then
```

That is a line-for-line mirror of `ci.yml`'s `set_gate`, and it is the script
someone runs precisely when they are trying to understand why a gate fired.
It will report the opposite of the truth on exactly the large diffs where the
question is worth asking.

`scripts/phase-g-hunt/classify.sh:40` (`echo "$canonical_classes" | grep -qx`)
is the same shape with a small input — latent rather than live, but it should
not be left as a template to copy. `scripts/ci/check-control-bytes.sh:22`
(`printf 'x' | grep -qP 'x'`) is a one-byte capability probe and is fine.

## Converged shape

A herestring is a temp file, not a pipe, so there is no reader to disappear
and nothing for `pipefail` to trip on:

```sh
if grep -qE "$INFRA_RE" <<<"$infra_files" || grep -qE "$re" <<<"$subject"; then
```

## Acceptance criteria

- [ ] `scripts/ci/gate-trace.sh` reads its gates with herestrings and agrees
      with `ci.yml`'s `set_gate` on a 750-file diff.
- [ ] `scripts/phase-g-hunt/classify.sh:40` converted likewise.
- [ ] A test or check pins the behaviour on an input large enough to trigger
      EPIPE, so the pipe form cannot come back silently.
- [ ] Grep confirms no remaining `(echo|printf) … | grep -q` under
      `set -o pipefail` in `.github/workflows/` or `scripts/`, excluding the
      constant-input probe in `check-control-bytes.sh`.
