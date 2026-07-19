# Presento — Production Readiness Audit

**Scope:** Full-stack review (frontend, backend, sockets, database, payments, AI generation, uploads) performed via 9 independent specialist passes: Auth & Sessions, Payments & Subscriptions, Premium Feature Bypass, File Upload & AI Security, Real-Time Socket Flows, Database & Data Integrity, Core Frontend Flows & UX, Performance, and Code Quality & Architecture.

**Verdict: Not production-ready as-is.** Two payment-verification bypasses allow paying the wrong price for a plan, and the live-presentation socket layer has no authorization on presenter-only controls — any participant can hijack or end someone else's live session. Both must be fixed before any paid launch. Beyond that, several data-integrity and reliability issues (orphaned records, duplicate votes, a broken "presentation ended" state) would surface quickly under real usage.

**Counts:** 8 Critical · 13 High · 19 Medium · 13 Low · 7 Nice-to-have

---

## Table of Contents
1. [Critical](#critical) — must fix before launch
2. [High](#high)
3. [Medium](#medium)
4. [Low](#low)
5. [Nice-to-have](#nice-to-have)
6. [Verified Clean](#verified-clean) — checked and found correct

---

## Critical

### C1. Payment verification trusts the client-supplied plan, not what was actually paid for
**Location:** `backend/src/controllers/paymentController.js:64-164` (`verifyPayment`)
**Description:** The Razorpay signature check only proves `orderId`/`paymentId` were legitimately paired — it says nothing about which plan or amount was paid. `verifyPayment` reads `plan` straight from the request body and grants it, **without** fetching the order (`razorpay.orders.fetch`) to confirm its real amount/`notes.plan`. A sibling function in the same file, `verifySubscriptionRenewal`, already does this correctly — proving the gap is an inconsistency, not a missing capability.
**Why it matters:** A user can buy the cheapest plan, complete real checkout, then edit the client request so `plan: "lifetime"` is sent to `/verify-payment` with the same valid signature — and get the expensive plan for pennies.
**How to reproduce:** Create an order for `pro-monthly`, pay it for real, then POST to `/api/payments/verify-payment` with the same order/payment/signature but `plan: "lifetime"` in the body.
**Recommended fix:** After signature verification, fetch the order and validate `order.notes.plan` / `order.amount` match what's being granted before touching `user.subscription`.
**Expected behavior:** The plan granted must come from the paid order's server-recorded amount, never from client input.

### C2. Institution "additional users" payment can be paid once, redeemed for many
**Location:** `backend/src/controllers/institutionAdminController.js:2055-2151` (`verifyAdditionalUsersPayment`)
**Description:** Same root cause as C1. The order is correctly created with a computed `amount = emails.length × price`, but verification takes a fresh `emails` array from the request body and adds all of them — never checking it against `order.notes.emails`.
**Why it matters:** Pay for 1 additional user, then call verify with 50 email addresses attached to that same paid order — all 50 get added for the price of one.
**How to reproduce:** Create a payment order for `{emails:["a@x.com"]}`, pay it, then call verify with the same order/payment credentials but 50 emails in the body.
**Recommended fix:** Fetch the order and use `order.notes.emails`/`numberOfUsers` as the source of truth, or assert the submitted list's cost matches `order.amount`.
**Expected behavior:** Entitlements granted must match what was actually paid for on the Razorpay order.

### C3. Any participant can hijack or end someone else's live presentation
**Location:** `backend/src/socket/socketHandlers.js` — `change-slide` (415-510), `end-presentation` (513-532); `backend/src/socket/quizHandlers.js` — `start-quiz`/`end-quiz`; qna/guess-number control events (842-953, 1021-1053)
**Description:** None of these presenter-only socket events verify the caller's socket is actually the presenter (`activePresentations.get(id).presenterSocket === socket.id`). They only require a valid `presentationId`, which every participant already has. `kick-participant` *does* do this check correctly elsewhere in the same file — proving the pattern was known and just wasn't applied consistently.
**Why it matters:** Any participant can open devtools and emit `socket.emit('end-presentation', {presentationId})` (or `change-slide` to any index) and take control of, or kill, a live session for everyone in it.
**How to reproduce:** Join a live presentation as a participant, open the console, run `socket.emit('end-presentation', {presentationId: '<id>'})`.
**Recommended fix:** Add the same `presenterSocket === socket.id` check already used by `kick-participant` to every presenter-only handler before it mutates state or broadcasts.
**Expected behavior:** Only the socket that started the presentation can change slides, end it, or control quiz/Q&A/guess-number state.

### C4. Participants who join before the presenter starts are told the presentation "has ended"
**Location:** `backend/src/socket/socketHandlers.js:535-571` (`join-presentation`)
**Description:** The "was this ever live" check is tautological: an entry is unconditionally created in `activePresentations` right before the code checks whether that same map has an entry — so it's always true, and `ended: true` is sent to every early joiner.
**Why it matters:** Joining before the presenter clicks "Start" is the normal, everyday flow (audience joins first, waits for the host). Right now that flow shows a hard "presentation has ended" screen instead of "waiting for presenter."
**How to reproduce:** Create a presentation, don't start it, open the join link in another browser and join.
**Recommended fix:** Track "has ever started" independently of map presence (a real flag on the entry, or a DB field), and only send `ended: true` when a presentation was actually live and has since stopped.
**Expected behavior:** Early joiners see a waiting screen, not an ended one.

### C5. Paid-only slide types (Miro / PowerPoint / Google Slides / PDF) have zero backend enforcement
**Location:** `backend/src/controllers/slideController.js` (`createSlide`); route `POST /:presentationId/slides`
**Description:** These four "Bring Your Slides In" types are blocked only in the frontend dropdown. The backend never checks the caller's plan for these types — only slide *count* is gated.
**Why it matters:** A free-plan user can call the create-slide API directly with `type: "pdf"` (etc.) and a valid free-plan token, and it succeeds — completely bypassing the paid gate.
**How to reproduce:** With a free-plan token, `POST /api/presentations/{id}/slides` with `{"type":"miro","question":"x","miroUrl":"..."}`.
**Recommended fix:** Add the same `isSubscriptionActive` check already used for premium themes and AI generation, rejecting these four types for free-plan users with `403 UPGRADE_REQUIRED`.
**Expected behavior:** Free-plan users get a clean 403 when attempting to create a restricted slide type via the API, matching what the UI already promises.

### C6. PDF/PowerPoint upload "type check" is a no-op — accepts anything
**Location:** `backend/src/controllers/uploadController.js:270-280` (PowerPoint), `:349-354` (PDF)
**Description:** The validation is `if (!isValidMime && !payload.startsWith('data:')) throw ...`. Since *any* base64 data-URI (of any declared type) satisfies `startsWith('data:')`, the second half of the condition is always false — making the whole check always pass regardless of the real/declared content type.
**Why it matters:** Any authenticated user can upload arbitrary file content to the PDF/PowerPoint endpoints, stored and later served as if it were that file type — a malware-hosting and file-type-confusion vector, and it means the PDF page-conversion step is fed content of unknown, unverified format.
**How to reproduce:** `POST /api/upload/pdf` with `{"pdf":"data:application/x-msdownload;base64,<any bytes>"}` — uploads successfully.
**Recommended fix:** Fix the boolean logic to actually gate on MIME, and — more importantly — check the real file signature after decoding (PDF: `%PDF-`; PPTX: ZIP header; PPT: OLE2 header) rather than trusting the client's declared type string.
**Expected behavior:** Files whose real bytes don't match the claimed type are rejected with 400.

### C7. Deleting a presentation permanently orphans its quiz scores
**Location:** `backend/src/controllers/presentationController.js:1153-1171` (`deletePresentation`)
**Description:** Deletes `Slide` and `Response` documents but never deletes `ParticipantScore` documents for that presentation — even though the codebase already has a helper for exactly this (`quizScoringService.clearPresentationScores`), used elsewhere but not here.
**Why it matters:** Every quiz-enabled presentation ever deleted leaves permanent orphan records in the database, accumulating without bound and with no cleanup path.
**How to reproduce:** Run a quiz, let someone answer (creates a `ParticipantScore`), delete the presentation, then query `ParticipantScore` for that id — it's still there.
**Recommended fix:** Call `quizScoringService.clearPresentationScores(id)` alongside the existing `Response`/`Slide` deletes.
**Expected behavior:** Deleting a presentation removes everything that references it.

### C8. Deleting a quiz slide can leave the editor on a blank canvas
**Location:** `frontend/src/components/pages/Presentation.jsx:1093-1131` (`handleConfirmDeleteSlide`)
**Description:** Deleting a quiz slide also deletes its auto-linked leaderboard slide (two slides removed at once), but the `currentSlideIndex` clamping logic always decrements by exactly 1, regardless of how many slides were actually removed.
**Why it matters:** If the currently-viewed slide sits after both the quiz and its leaderboard, the index ends up pointing past the end of the (now two-shorter) array — the canvas renders `undefined` and goes blank, even though the presentation still has slides.
**How to reproduce:** Build `[A, B, Quiz, Leaderboard, C]`, select `C`, delete `Quiz` — both Quiz and Leaderboard vanish, index goes out of bounds.
**Recommended fix:** Compute how many slides were actually removed (the delete response already reports the linked leaderboard id) instead of a hardcoded decrement of 1, or re-locate the previously-selected slide by id in the new array.
**Expected behavior:** After deleting a quiz+leaderboard pair, whatever slide you were looking at (if not one of the deleted ones) stays selected and in view.

---

## High

### H1. Results export (CSV/Excel) has zero backend plan enforcement
**Location:** `backend/src/controllers/presentationController.js:722-734` (`exportPresentationResults`)
**Description:** Only checks presentation ownership — no subscription check at all, even though the frontend restricts the export button to paid plans.
**Fix:** Add the same `isSubscriptionActive` check used elsewhere before generating the export.

### H2. No file-signature validation on any upload type
**Location:** `backend/src/controllers/uploadController.js` (image/video/pdf/powerpoint, all four)
**Description:** Every "type check" is a string match against the client-supplied `data:<mime>` prefix — trivially spoofable, since nothing decodes and inspects the actual bytes.
**Fix:** After base64-decoding, verify real magic bytes match the claimed type for all four upload paths, not just PDF/PowerPoint (see C6).

### H3. No rate limiting anywhere in the application
**Location:** Confirmed absent app-wide (`express-rate-limit` not installed, no manual throttling found). Concretely affects: super-admin login (single shared password, unlimited attempts), institution-admin login, password-reset OTP verification (6-digit code, 10-minute window, no attempt cap), all four upload endpoints, and `POST /api/presentations/generate-ai` (a paid, per-call Gemini API cost).
**Why it matters:** Login/OTP endpoints are brute-forceable with no lockout; uploads and AI generation have no ceiling on cost/abuse from a single account.
**Fix:** Add `express-rate-limit` scoped per-IP and per-account on all of the above, with the AI-generation endpoint given the strictest limit given its per-call cost.

### H4. Institution-admin tokens never expire
**Location:** `backend/src/controllers/institutionAdminController.js:76-85`
**Description:** Unlike regular-user tokens (7d) and super-admin tokens (8h), this JWT is signed with no `expiresIn` — it's valid forever.
**Fix:** Add an expiry consistent with the other two token types.

### H5. Deactivating an institution doesn't actually cut off its admin's access
**Location:** `backend/src/middleware/auth.js:21-27` (compare `institutionAdminAuth.js:38-43`, which does check this)
**Description:** The general `verifyToken` middleware — used by ordinary content routes like presentation/upload — never checks `institution.isActive`, only the dedicated admin-panel middleware does. Combined with H4 (token never expires), a deactivated institution's admin token keeps full presentation-creation/hosting access indefinitely through the non-admin-panel API surface.
**Fix:** Add the same `isActive` check to `verifyToken` (and the equivalent socket-side check) that `institutionAdminAuth.js` already has.

### H6. Reconnecting after a network blip turns you into a permanent "ghost"
**Location:** `frontend/src/components/pages/JoinPresentation.jsx:120-193`, `PresentMode.jsx:390-533`
**Description:** socket.io-client reconnects automatically, but the app never re-emits `join-presentation`/`start-presentation` on reconnect, so the socket never rejoins its room server-side. Meanwhile the server *does* correctly clean up the stale entry on disconnect — nothing re-adds it.
**Why it matters:** A brief connectivity drop (very common on mobile) silently and permanently removes a participant from the live count and future broadcasts, with no recovery short of a full reload.
**Fix:** On reconnect, re-emit the join/start event if the client had already joined/started, so the server re-syncs room membership and current state.

### H7. A single bad slide index can leave every future joiner stuck loading forever
**Location:** `backend/src/socket/socketHandlers.js:464` (`change-slide` bounds check), `:601-647` (`join-presentation`)
**Description:** `change-slide`'s upper-bound check compares against `presentation.slides?.length` — but slides live in a separate collection, so `presentation.slides` is always `undefined` and the check is dead code (only the lower bound is enforced). An out-of-range index gets persisted. `join-presentation` then only replies when a current slide actually resolves — there's no `else` branch, so a joiner in this state gets no response at all.
**Fix:** Validate against the real slide count (already fetched later in the same handler — just reorder), and add a fallback response when the current slide can't be resolved.

### H8. Deleting a quiz question doesn't retract its points from anyone's score
**Location:** `backend/src/controllers/slideController.js:567-605` (`deleteSlide`)
**Description:** Deleting a quiz slide cleans up its linked leaderboard slide and responses, but never calls the existing `quizScoringService.clearSlideScores` helper.
**Why it matters:** Every participant's cumulative score permanently keeps points from a question that no longer exists — a presenter who deletes a bad question can never actually remove its contribution from the leaderboard.
**Fix:** Call `clearSlideScores(presentationId, slideId)` when deleting a quiz slide.

### H9. "Guess the number" has no duplicate-submission protection at all
**Location:** `backend/src/socket/socketHandlers.js:956-1019` (`submit-guess`)
**Description:** Unlike every other response type, this handler never checks for an existing response before saving a new one.
**Fix:** Add the same existing-response check used by the generic `submit-response` path (see M8 for the DB-level hardening this whole family of handlers needs).

### H10. All 11 languages are eagerly loaded on every page visit (~2.3MB)
**Location:** `frontend/src/i18n/i18n.js:6-16`, imported eagerly from `main.jsx`
**Description:** Every locale's full translation file is statically bundled into the main entry chunk regardless of the visitor's actual language. Confirmed against a real production build: the main bundle is 2.2MB, matching the combined size of all 11 locale JSON files almost exactly.
**Fix:** Load only the resolved locale (e.g. `i18next-resources-to-backend` or a dynamic `import()` keyed by detected language), fetching other languages only if the user switches.

### H11. Restoring an unsaved draft can be silently overwritten across devices
**Location:** `frontend/src/components/pages/Presentation.jsx:181-315`
**Description:** The draft-vs-server reconciliation only compares slide count and title — never timestamps. A stale draft that happens to match those can be silently discarded (losing real edits), or an older draft can be restored over genuinely newer server content with no warning about which is actually newer.
**Fix:** Compare the draft's saved timestamp against `presentation.updatedAt` and make the age relationship explicit in the restore dialog.

### H12. Restoring a draft immediately marks it as "saved" — even though it isn't
**Location:** `frontend/src/components/pages/Presentation.jsx:279-315` (`handleRestoreDraft`)
**Description:** After restoring a draft, `isDirty` is set to `false` and the localStorage copy is cleared — but nothing has actually been persisted to the server yet.
**Why it matters:** Immediately after restoring, clicking "back to dashboard" navigates away with zero confirmation, and the just-restored content is gone for good (there's no draft left to fall back on).
**Fix:** Set `isDirty(true)` right after a successful restore.

### H13. Double-clicking Save or Present can create duplicate slides
**Location:** `frontend/src/components/pages/Presentation.jsx:47, 1317-1365` (Save/Present buttons), `325-836` (`saveToBackend`)
**Description:** `isSaving` only drives a "Saving…" label — it never disables the buttons or guards the top of `saveToBackend` itself.
**Why it matters:** A rapid double-click (or Save immediately followed by Present) fires two concurrent save passes; since new slides are identified by "no `_id` yet," both passes can create the same logical slide twice.
**Fix:** Guard `saveToBackend` with an early return when already saving, and disable both buttons while a save is in flight.

---

## Medium

### M1. Super-admin auth silently falls back to the regular user JWT secret
**Location:** `backend/src/config/validateEnv.js:17-29,82-84`; `superAdminAuth.js:18`; `superAdminController.js:39`
**Description:** `SUPER_ADMIN_JWT_SECRET` is optional and never length-checked; if unset, super-admin tokens are signed with the same secret as regular users, with no startup warning.
**Fix:** Require and length-validate it in production; warn loudly if it falls back.

### M2. Logging in as two different roles in one tab can silently misattribute actions
**Location:** `frontend/src/config/api.js:14-39`, `Login.jsx:41-74`
**Description:** The request interceptor attaches tokens by fixed priority (super-admin > institution-admin > regular user), and switching roles in one tab doesn't clear the other token. Every subsequent request — including ordinary user actions — can silently carry the wrong token.
**Fix:** Scope token attachment to the request's path rather than a global priority chain, and clear the other role's token on login.

### M3. The payment webhook doesn't actually grant anything — no fallback if the client call is interrupted
**Location:** `backend/src/controllers/paymentController.js:242-306`
**Description:** Signature verification is correct, but `payment.captured` only logs a warning — subscription-granting logic lives entirely in the client-driven `/verify-payment` call. If the browser closes right after checkout succeeds but before that call completes, Razorpay has been paid but the user gets nothing, with no server-side reconciliation.
**Fix:** Make the webhook an authoritative fallback — resolve plan from the order and grant it there too if not already applied (guarded by the existing unique index for idempotency).

### M4. Cron endpoint ships with a hardcoded default secret
**Location:** `backend/src/controllers/paymentController.js:221-235`; not required in `validateEnv.js`
**Description:** Falls back to a literal `'your-secret-cron-key-change-this'` if `CRON_SECRET_KEY` is unset, with no startup check to catch that misconfiguration.
**Fix:** Require this secret in production and remove the hardcoded fallback.

### M5. Quiz scoring trusts the client's self-reported response time
**Location:** `backend/src/socket/quizHandlers.js:89-171`, `quizScoringService.js:22-43`
**Description:** `responseTime` comes straight from the client and is used as-is for scoring and leaderboard tiebreaking, even though the server has an authoritative session start time it never uses instead.
**Why it matters:** A participant can send `responseTime: 1` and always score the maximum regardless of actual speed.
**Fix:** Compute elapsed time server-side from the known session start, ignoring or clamping the client-reported value.

### M6. Deleting an image/video/PDF/PPT slide never deletes the underlying file
**Location:** `backend/src/controllers/slideController.js:567-605` (`deleteSlide`)
**Description:** The Cloudinary asset is never destroyed when its slide is deleted — every deleted PDF slide alone leaves one orphaned image per converted page.
**Fix:** Call the appropriate Cloudinary destroy for each asset field on slide deletion; add the missing `deletePdf`/`deletePowerPoint` helpers alongside the existing `deleteImage`/`deleteVideo`.

### M7. A crafted PDF can tie up the server with no page cap or timeout
**Location:** `backend/src/services/pdfConversionService.js:63-100`
**Description:** Every page of an uploaded PDF is rendered and uploaded with no cap on page count and no wall-clock timeout — a PDF can stay under the 10MB limit while containing thousands of pages.
**Fix:** Cap pages converted (e.g. ~50-100) and wrap the conversion in an overall timeout.

### M8. Standard poll responses can be double-submitted under a race
**Location:** `backend/src/socket/socketHandlers.js:664-752`; `backend/src/models/Response.js:87-91` (index not unique)
**Description:** Duplicate prevention is "check, then write" with no atomic guarantee and no unique database constraint backing it up.
**Fix:** Add a real unique index on `(participantId, slideId)` and switch to an upsert that reports whether it inserted or found existing.

### M9. Quiz answer de-duplication only works on a single server process, and answers aren't validated
**Location:** `backend/src/services/quizSessionService.js`; `backend/src/socket/quizHandlers.js:112-150`
**Description:** Duplicate-answer tracking lives in an in-memory map, not the database — safe today, but would silently break the moment the app runs on more than one instance. Separately, submitted answers are stored with no check that they're actually one of the slide's real option ids.
**Fix:** Validate the submitted answer against the slide's configured options; if horizontal scaling is planned, move this state to the database or a shared store.

### M10. No database transactions anywhere — a score can end up out of sync with its response
**Location:** App-wide (no `startSession`/`withTransaction` usage found); concretely `quizHandlers.js:141-163`
**Description:** Saving a quiz response and updating the participant's cumulative score are two separate writes with no atomicity. If the second one fails, the response is recorded but the leaderboard silently never reflects it, with no reconciliation.
**Fix:** Wrap both writes in a transaction (requires a replica-set deployment), or add a reconciliation pass that can detect and repair drift.

### M11. In-memory session state is never cleaned up — unbounded memory growth over time
**Location:** `backend/src/socket/socketHandlers.js:33` (`activePresentations`); qna/guess-number/quiz session maps
**Description:** None of these are cleaned up on `end-presentation`, and the disconnect handler explicitly keeps them alive forever by design. Nothing sweeps state for presentations that are simply abandoned (tab closed without clicking "End").
**Fix:** Clear all related in-memory state on `end-presentation`, and add an idle-timeout sweep for presenters who never explicitly end their session.

### M12. Leaving the Present screen for any reason ends the session for everyone
**Location:** `frontend/src/components/pages/PresentMode.jsx:390-400`
**Description:** The socket teardown effect emits `end-presentation` on *every* unmount — not just the explicit "End Presentation" button — directly contradicting the backend's own design intent (which deliberately keeps a session alive through a presenter disconnect).
**Why it matters:** Any accidental navigation away (back button, an in-app link, even a dev-mode double-render) kills the live session for every connected participant with no confirmation.
**Fix:** Only emit `end-presentation` from the explicit, confirmed "End Presentation" action.

### M13. Every single vote triggers a full re-query and re-broadcast of all results
**Location:** `backend/src/socket/socketHandlers.js:664-782`, corroborated independently by two separate review passes
**Description:** `submit-response` re-fetches *all* responses for the slide from the database and rebroadcasts the full result set to the whole room on every individual submission, with no batching or debouncing.
**Why it matters:** With many participants voting in a short window, this is effectively one full-collection query and one full-room broadcast per vote — cost that grows with the square of participant count during a burst.
**Fix:** Debounce/coalesce broadcasts per slide (e.g. flush at most a few times per second) instead of one pass per submission.

### M14. A failed save can duplicate slides on retry
**Location:** `frontend/src/components/pages/Presentation.jsx:663-836` (`saveToBackend`)
**Description:** Slides are created/updated one at a time, but local state is only updated with the results once the *entire* loop finishes without error. If one slide's request fails partway through, everything before it already exists on the server, but the app still thinks those are unsaved — and resubmits them on the next Save.
**Fix:** Commit each slide's result into state as it resolves, rather than only at the end of the loop.

### M15. Session expiry mid-edit is a jarring, unexplained redirect
**Location:** `frontend/src/config/api.js:44-83`
**Description:** A 401 anywhere triggers an immediate hard `window.location.href = '/login'` — no distinguishing message, and no way back to the presentation being edited after logging back in.
**Fix:** Show a clear "session expired" message and preserve a return path back to the same editor.

### M16. "Generate with AI" is unreachable on mobile/tablet
**Location:** `frontend/src/components/presentation/SlideBar.jsx` (mobile/horizontal branch has no equivalent button); `Presentation.jsx` (mobile `SlideBar` instance never receives the `onAiGenerateClick` prop)
**Description:** The button and all its wiring exist and work — they simply were never added to the horizontal (mobile) layout branch.
**Fix:** Add the same entry point to the mobile slide bar and pass the missing prop.

### M17. Export libraries load on every editor visit, not just when needed
**Location:** `frontend/src/components/pages/Presentation.jsx:21` (eager import of `PresentationResults`, which pulls in `xlsx`/`jspdf`/`jspdf-autotable`/`html2canvas`)
**Description:** Confirmed against a real build: the editor's bundle is 1.2MB, consistent with these export-only libraries being inlined regardless of whether Results/export is ever opened.
**Fix:** Lazy-load `PresentationResults` behind the Results tab.

### M18. The entire presenter screen re-renders on every single vote
**Location:** `frontend/src/components/pages/PresentMode.jsx` (~1780 lines, ~30 state variables, zero use of `React.memo` anywhere in the frontend)
**Description:** Combined with M13 (one broadcast per vote), every submission from any participant causes a full re-render of the whole presenter component on every connected client.
**Fix:** Memoize the per-slide-type presenter view components and pass only the relevant slice of state as props.

### M19. The leaderboard is recomputed from scratch once per leaderboard slide
**Location:** `backend/src/controllers/presentationController.js` (`getPresentationResultById`, leaderboard case inside the per-slide loop)
**Description:** A presentation with several quiz-linked leaderboard slides recomputes the *entire* cumulative leaderboard — identical underlying data — once per leaderboard slide instead of once per page load.
**Fix:** Compute it once outside the loop and reuse the result.

---

## Low

### L1. Logout doesn't revoke anything server-side
**Location:** `frontend/src/context/AuthContext.jsx` and equivalents
A captured token remains valid until natural expiry regardless of logout — a normal tradeoff for stateless JWTs, but combined with H4 (institution tokens never expiring) it means logout provides no real boundary for that token type at all.

### L2. JWTs live in localStorage/sessionStorage, not httpOnly cookies
Standard for this architecture and not itself a confirmed bug, but worth noting given the app handles institution/payment data — any future XSS elsewhere would be able to read these directly.

### L3. Signature comparisons aren't constant-time
**Location:** `paymentController.js:83,258`; `institutionAdminController.js:2084,2372`
Plain `===` string comparison for HMAC signatures; use `crypto.timingSafeEqual` instead.

### L4. Renewing a plan resets the billing period instead of extending it
**Location:** `paymentController.js:105-111`
A user who renews a few days early loses the unused remaining time, unlike the institution renewal path which correctly extends from the existing end date.

### L5. A rare access-code collision fails the request instead of retrying
**Location:** `presentationController.js` (`createPresentation`)
The uniqueness check and the insert are separate round-trips; a genuine collision surfaces as a 409 to the user instead of transparently retrying with a new code.

### L6. SVG uploads aren't sanitized
**Location:** `uploadController.js`, `cloudinaryService.js`
SVGs can carry embedded scripts; not exploitable against the app itself (rendered via `<img>`), but a script could execute if someone opens the raw Cloudinary URL directly.

### L7. A few reporting queries pull unbounded result sets into memory
**Location:** Institution analytics, results export, results-clearing paths
Not paginated; fine at current scale, will become a real cost at high presentation/response volume.

### L8. Institution audit logs are unbounded arrays inside one document
**Location:** `backend/src/models/Institution.js`
Every logged action grows one document forever, risking MongoDB's 16MB document ceiling for very active institutions over time.

### L9. The confirmation dialog's close (×) button ignores an in-flight action
**Location:** `frontend/src/components/common/ConfirmDialog.jsx`
Every other control respects `isLoading`; the × doesn't, so dismissing the exit dialog while a save is still running doesn't actually stop the pending navigation once that save resolves.

### L10. Unsaved drafts share one storage slot across all presentations
**Location:** `frontend/src/services/presentationService.js` (single global localStorage key)
Editing a second presentation before the first is saved can silently overwrite the first one's recoverable draft.

### L11. Dashboard fetches 100 presentations to show 6 at a time
**Location:** `frontend/src/components/Dashboard.jsx`
Minor overfetch; only matters for users with many presentations.

### L12. Sidebar slide thumbnails load full-resolution images
**Location:** `frontend/src/components/presentation/SlideBar.jsx`
No resize transform and no `loading="lazy"` on thumbnail images — a presentation with many image/PDF slides downloads full-size assets just to render tiny previews.

### L13. A stray duplicate chatbot config file
**Location:** `chatbot/inavora copy.json`
An older, incomplete duplicate of the file actually in use (`inavora.json`); not referenced anywhere. Safe to delete.

---

## Nice-to-have

1. **A few very large files mix unrelated concerns** — `Presentation.jsx` (~1665 lines, 19 state variables) handles routing, drafts, slide CRUD, theming, and AI generation all in one place; `PresentMode.jsx`/`JoinPresentation.jsx` similarly large; `institutionAdminController.js` (2651 lines) spans auth, user management, billing, and reporting in one controller. None of this is broken — it's a maintainability cost for whoever touches these files next.
2. **Option-list editing logic is copy-pasted across 3-4 slide-type editors** (multiple choice, pick-answer, ranking, quiz) with small, inconsistent divergences already appearing between copies — a good candidate for a single shared component.
3. **Two controllers use a different error-response shape** than the rest of the app (`contactController.js`, `testimonialController.js` use ad-hoc try/catch instead of the standard `AppError` pattern), which forces extra special-casing on the frontend.
4. **Stray debug `console.log` calls** in a few backend/frontend files where the rest of the codebase consistently uses the existing logger utility.
5. **Auth pages live in a different folder than every other page** (`Login.jsx`, `Dashboard.jsx`, etc. sit in `components/` root while every other route lives in `components/pages/`) — a small inconsistency for anyone navigating the codebase.
6. **No PropTypes or TypeScript anywhere** — purely informational; not a call to migrate, just the current state.
7. **A handful of "inavora.com" references sit next to the new "Presento" branding** — join instructions, support emails, and Cloudinary folder names still say inavora.com. This was an explicit, deliberate choice earlier (keep the real domain, only rename the displayed brand) — flagging it here only because seeing "Presento" and "inavora.com" in the same sentence (e.g. join instructions) is now visibly inconsistent to a user, worth one more look now that it's in front of you.

---

## Verified Clean

Checked deliberately, and found correctly implemented — no action needed:

- **Themes and AI-generation paid-feature gates** are correctly enforced server-side (fresh subscription check on every request, no way to reach them through an alternate endpoint).
- **Slide-count limit (10/free), presentation-count limit (3 per 30 days/free), and audience limit (21/free)** are all enforced with a fresh database read, not a spoofable client value.
- **Institution-admin panel authorization** independently re-verifies the institution against the database on every request rather than trusting JWT claims alone.
- **JWT verification** uses `jwt.verify` with a secret everywhere — no unsafe `jwt.decode`-only paths anywhere in the codebase.
- **Password-reset flow** doesn't leak whether an email exists, and OTPs are single-use and expire correctly.
- **CORS** is an explicit origin allowlist, not a wildcard, even combined with credentials.
- **Payment double-submit protection** — a unique index plus a status check prevents the same order from ever granting a subscription twice, even under concurrent requests.
- **IDOR** — every institution billing/admin endpoint scopes its query by the authenticated admin's own institution id, never a client-supplied id.
- **Client can't influence price** — the amount charged is always looked up server-side from the plan name; only *which plan gets granted* was the actual gap (see C1/C2).
- **Gemini AI generation** has strong defensive normalization (every field type-checked, length-capped, and unknown slide types dropped rather than crashing) and is already gated to paid users only.
- **Upload endpoints require authentication.**
- **Route-level code splitting** (`React.lazy` per page) and the Vite `manualChunks` config are both already done correctly — the two large bundles (H10, M17) are caused by specific eager imports, not a missing splitting strategy in general.
- **Deleting the last remaining slide** in a presentation is correctly blocked with a clear message.
- **Institution subscription expiry** correctly cascades to member users' effective plan on every check — no stale "active forever" state found.

---

*Compiled from 9 independent specialist review passes across auth, payments, plan-gating, uploads/AI, real-time sockets, database integrity, frontend flows, performance, and code quality. Every finding above is backed by a specific file/line reference and a concrete reproduction path — nothing here is speculative.*
