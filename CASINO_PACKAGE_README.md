# ST25 Casino — lightweight Lúa wallet package

Includes slots, European roulette, blackjack and roll-under/over Dice. No frontend dependencies, fonts, downloaded artwork or demo balance. Results are generated on the server using Node crypto; the authenticated Steam player uses the existing IslePilot Lúa wallet.

## Install into this ST25 Node/Express project

1. Back up affected source files. Extract the ZIP into the project root, preserving directories. The ZIP contains feature files and modified route/store files only; it excludes credentials, node_modules, database records and unrelated assets.
2. If your target checkout differs, merge the casino-wallet controller registration in `src/routes/api.js`, the three casino wallet route definitions in `src/api/endpoints.js`, and the casino pending-round check in `src/models/plinko-store.js` instead of replacing those files wholesale. The page also reuses your existing `assets/css/redesign.css` and `assets/js/ui.js`.
3. Reuse the existing `express` and `pg` dependencies, Steam session setup, IslePilot credentials and database connection. Set `CASINO_WALLET_ENABLED=true`. Database URL uses `PLINKO_DATABASE_URL` or `PORTAL_DATABASE_URL`; use direct PostgreSQL. The database role must be allowed to create the casino table/index.
4. Run `node tests/casino-wallet-regression.cjs`, `node tests/casino-wallet-deep.cjs`, `node tests/casino-http.cjs` and the existing project suite. The optional `node tests/casino-browser.cjs` runs offline Chrome tests using the Windows Chrome path in that script. Then deploy your existing website. Visit `/casino.html`; add a navigation link wherever desired.
5. Verify database connectivity, authenticated balance, upstream currency permissions and transaction records in the deployed environment before announcing availability. The frontend displays backend connection/disabled errors and offers a read-only reconnect button.

## Games and payouts

- Dice: server-generated uniform roll from 0.00 to 99.99, stored as integer hundredths 0–9999. Choose an integer target from 5 to 95. Under wins strictly below the target; over wins at or above it. Win probability is target% for under and (100−target)% for over. Winning payout is floor(stake × 97 / win probability in percent), including stake. Theoretical return is 97% before whole-Lúa rounding, lower after rounding. The page shows win chance, multiplier and actual integer payout before each roll. Test with `node tests/dice-regression.cjs`.
- Slots: three independent, uniform six-symbol reels. Three matching symbols pay 8×/10×/12×/16×/24×/40× respectively; other results pay zero. The theoretical return is 110/216, about 50.93%. Rules are displayed on the page.
- Roulette: uniform 0–36, red/black/even/odd pay 2×, a single number pays 36×. Zero loses outside bets. Theoretical return 36/37, about 97.30%.
- Blackjack: shuffled single deck; dealer stands on all 17; natural blackjack pays floor(2.5× stake), ordinary win 2×, push returns stake. No split, double, surrender or insurance. Aces count as 1 or 11. Active hands resume from server state after reloading.
- Payouts include the original stake. Bet limits: 1–500 integer Lúa. Lúa is a free game point, with no cash conversion.

## Persistence and integration

`GET /api/casino-wallet/state`, `POST /api/casino-wallet/play` and `POST /api/casino-wallet/action` are same-origin routes under existing authentication/security middleware. Rounds are stored in `st25_casino_rounds`. Each play uses a UUID; replaying an existing round does not debit again. Blackjack actions include the current player-card count as a version to reject repeated hits. Hidden dealer cards and the remaining deck never leave the server during an active hand.

Casino uses Plinko's PostgreSQL player advisory lock. Active casino hands and uncertain casino/Plinko rounds block new plays in these two features. This does not coordinate every other game or external wallet mutation: existing wallet-wide atomic/idempotency limitations remain. Keep unrelated wallet integrations in mind during deployment.

Pending debit/credit or review states require administrator reconciliation against upstream currency logs. Currency reason is `st25_casino_debit_<round UUID>` or `st25_casino_payout_<round UUID>`. Never automatically resend an uncertain currency request or manually clear a record without checking wallet evidence. A confirmed debit with failed payout is preserved for review; no automatic refund is attempted.

## Packaging and validation

The frontend is already compact plain HTML/CSS/JS. The ZIP uses maximum Deflate compression; server readable sources and offline regression tests are retained. Existing project dependencies are deliberately excluded. This is an integration package, not a standalone wallet service.

Offline tests do not spend actual Lúa. Retesting passed in headless Chrome at 1440/768/390/320px; desktop and phone screenshots were visually inspected. The full existing regression suite, expanded engine/wallet tests and real HTTP security/controller tests passed. See `CASINO_RETEST_REPORT.md` for evidence and remaining deployment checks. This package has not been deployed to www.st25.io.vn and does not itself fix that domain's closed Plinko configuration.
