#!/usr/bin/env bash
# rfc-refine-done.sh — signal btwhooks that an RFC-refine (story grooming) agent
# has finished, hand its markdown summary to the dashboard, and tear down its
# tmux pane.
#
# Usage: rfc-refine-done.sh <rfc-slug> <outcome> [summary-file]
#   outcome ∈ changed | no-change | aborted
#   summary-file  path to a markdown file with the agent's report (optional;
#                 empty/missing ⇒ no summary, just the outcome + pane reap).
#
# This is the RFC-level counterpart to refine-done.sh. It POSTs the *ungated*
# form of /cleanup-pane (no PR ⇒ the server skips the merge gate), keyed on
# $TMUX_PANE, so btwhooks reaps the pane. The report itself (kind, id, outcome,
# summary) is POSTed to trailmap's /rfc-refines, which renders it on the RFC
# page. A failed trailmap POST still reaps the pane, then exits non-zero.
#
# Lives in this repo because refine agents run in a tasks worktree: btwhooks
# spawns them with RepoDir=<tasks checkout> via scripts/start-worktree.sh, so
# their cwd is a checkout of this repo. Both scripts sat in trails until now,
# which meant cd-ing into an unrelated repo to reach a script that only ever
# talks to btwhooks.
set -euo pipefail

SLUG="${1:?usage: rfc-refine-done.sh <rfc-slug> <outcome> [summary-file]}"
OUTCOME="${2:?usage: rfc-refine-done.sh <rfc-slug> <outcome> [summary-file]}"
SUMMARY_FILE="${3:-}"

SUMMARY=""
if [[ -n "$SUMMARY_FILE" ]]; then
  if [[ -r "$SUMMARY_FILE" ]]; then
    SUMMARY="$(cat "$SUMMARY_FILE")"
  else
    echo "rfc-refine-done: summary file '$SUMMARY_FILE' not readable — sending empty summary" >&2
  fi
fi

TRAILMAP_STATUS=0
# btwebooks webhook/grades.go:210 runs this script with the slug `grades`,
# which is not an RFC: trailmap would answer 404, so only the reap runs.
if [[ -d "$(dirname "$0")/../rfcs/${SLUG}" ]]; then
  TRAILMAP_API="${TRAILMAP_API:-http://127.0.0.1:8080}"
  TOKEN="$(cat "$HOME/.config/trailmap/ingest-token" 2>/dev/null || true)"
  REFINE_PAYLOAD="$(jq -nc \
    --arg kind "rfc-refine" \
    --arg id "$SLUG" \
    --arg outcome "$OUTCOME" \
    --arg summary "$SUMMARY" \
    '{kind:$kind, id:$id, outcome:$outcome, summary:$summary}')"
  TM_CODE="$(curl -s -o /tmp/.rrd-tm.$$ -w '%{http_code}' --max-time 10 -X POST \
    "${TRAILMAP_API}/rfc-refines" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H 'Content-Type: application/json' \
    -d "$REFINE_PAYLOAD" || true)"
  TM_BODY="$(cat /tmp/.rrd-tm.$$ 2>/dev/null || true)"
  rm -f /tmp/.rrd-tm.$$
  echo "rfc-refine-done: trailmap http=${TM_CODE}"
  if [[ ! "$TM_CODE" =~ ^2[0-9][0-9]$ ]]; then
    echo "rfc-refine-done: trailmap POST ${TRAILMAP_API}/rfc-refines failed: http=${TM_CODE} body=${TM_BODY:-<empty>}" >&2
    TRAILMAP_STATUS=1
  fi
else
  echo "rfc-refine-done: '${SLUG}' is not an RFC, skipping the trailmap POST"
fi

if [[ -z "${TMUX_PANE:-}" ]]; then
  echo "rfc-refine-done: \$TMUX_PANE unset — not running inside a tmux pane, skipping cleanup" >&2
  exit "$TRAILMAP_STATUS"
fi

# Resolve the btwhooks container IP the same way the other skills do.
DOCKER_INSPECT_ERR="$(docker inspect btwhooks.web.1 --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}={{$v.IPAddress}}{{"\n"}}{{end}}' 2>&1 1>/tmp/.rrd-ip.$$ || true)"
# The container can be on several networks (bridge + fleet); one IP, bridge first.
CONTAINER_IP="$(awk -F= '$1 == "bridge" { print $2; found = 1; exit } { if (!first) first = $2 } END { if (!found && first) print first }' /tmp/.rrd-ip.$$ 2>/dev/null || true)"
rm -f /tmp/.rrd-ip.$$
if [[ -z "$CONTAINER_IP" ]]; then
  echo "rfc-refine-done: btwhooks.web.1 container not found, skipping cleanup" >&2
  echo "rfc-refine-done: docker inspect stderr: ${DOCKER_INSPECT_ERR}" >&2
  exit "$TRAILMAP_STATUS"
fi
echo "rfc-refine-done: resolved container IP ${CONTAINER_IP}"

# No "pr" field ⇒ the server takes the ungated fire-and-forget path. The
# summary now goes to trailmap above, so it is not sent here.
PAYLOAD="$(jq -nc \
  --arg kind "rfc-refine" \
  --arg id "$SLUG" \
  --arg outcome "$OUTCOME" \
  --arg pane "$TMUX_PANE" \
  '{kind:$kind, id:$id, outcome:$outcome, pane:$pane}')"

HTTP_CODE="$(curl -s -o /tmp/.rrd-body.$$ -w '%{http_code}' --max-time 5 -X POST \
  "http://${CONTAINER_IP}:8081/cleanup-pane" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD" 2>/tmp/.rrd-err.$$ || echo "curl-failed")"
RESP_BODY="$(cat /tmp/.rrd-body.$$ 2>/dev/null || true)"
CURL_ERR="$(cat /tmp/.rrd-err.$$ 2>/dev/null || true)"
rm -f /tmp/.rrd-body.$$ /tmp/.rrd-err.$$
echo "rfc-refine-done: http=${HTTP_CODE} body=${RESP_BODY:-<empty>} err=${CURL_ERR:-<none>}"
exit "$TRAILMAP_STATUS"
