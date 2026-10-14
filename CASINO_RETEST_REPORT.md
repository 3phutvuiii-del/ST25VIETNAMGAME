# Casino retest — 15 October 2026 (Asia/Bangkok)

Result: automated offline checks and local Chrome QA pass after fixes. Production release verification remains incomplete. Use the updated tested archive, not the original archive from before this retest.

## Issues fixed

- Registered the three casino routes in the shared API definitions and updated route-count integration coverage.
- Added the website's shared theme/UI references required by the existing integration checks.
- Hid blackjack dealer hole cards in pending/review rounds as well as active rounds. The deck is never returned.
- Added HTTP 400 validation for missing request bodies and malformed blackjack round IDs, avoiding generic errors or invalid UUID database queries.
- Pending/review blockers now query persistent records independently of the last 30 history items. Plinko pending transactions are reflected in casino state, preventing an enabled play button when new rounds must be blocked.
- Negative wallet balances no longer report as available.

## Passed checks

| Check | Coverage |
| --- | --- |
| `tests/casino-wallet-regression.cjs` | Payout basics, private cards, versions, replay protection, active recovery, uncertain debit/payout |
| `tests/casino-wallet-deep.cjs` | All 216 slot combinations, all 1,517 roulette bet/number pairs, 20,000 completed blackjack simulations, 20 concurrent identical requests, malformed requests, insufficient balances, pending-card privacy, old unresolved records, Plinko blocking, database outage |
| `tests/casino-http.cjs` | Real Express controller and security middleware, signed sessions, forged IDs, cross-origin rejection, no-store responses, upstream adapter, replay, failed-debit cache invalidation |
| `tests/casino-browser.cjs` | Chrome at 1440/768/390/320px; real button clicks, slots/roulette, blackjack reload recovery/hit/stand, rapid-click suppression, ambiguous post-settlement response/reconnect, login/disabled/review gates; no JS exceptions |
| Existing project test script (all 11 commands) | Plinko, authentication, API concurrency, skin integration, syntax/assets, backend security, architecture, frontend, home player UI, quests, shared theme |
| `tests/plinko-browser.cjs` | Existing multi-ball Plinko browser regression passed |

Browser output: `.build-cache/casino-browser/results.json` and `casino-{width}.png`. At every tested width there was no horizontal overflow, all 41 roulette choices were present and the play button height exceeded 44px. Desktop and 320px screenshots were visually inspected.

All balances, persistence, upstream calls and outcomes used test fixtures. No live Lúa was spent. The concurrent service test uses an in-memory model of the player lock; it does not validate actual PostgreSQL lock behavior across deployed instances. HTTP tests do validate the real controller and middleware with fake persistence/upstream.

## Remaining checks before public release

1. Deploy in a controlled hosting environment with the correct project/domain, a strong private `SESSION_SECRET`, valid Steam callback, direct PostgreSQL connection and `CASINO_WALLET_ENABLED=true`.
2. Verify actual table/index creation, durable round recovery and PostgreSQL advisory locking across separate deployed instances. Real database schema/permissions were not tested in this retest.
3. Verify actual IslePilot currency responses/permissions, debit/payout logs and balance freshness on an explicitly approved test account and test budget. Upstream timeout/idempotency behavior was not verified against the live wallet here.
4. Verify concurrent wallet behavior with other features. Casino and Plinko share their lock; unrelated game features and direct upstream wallet mutations do not all participate. External wallet-wide atomicity is not guaranteed by this package.
5. Reconcile any `debit_pending`, `credit_pending` or `review` round against the upstream wallet ledger; do not automatically retry uncertain currency mutations or clear blocking records without evidence.

These tests give evidence for the implemented behavior, not a guarantee that no production failure can occur. Valid hosting access and a live integration check are still required before marking the game ready for public release.
