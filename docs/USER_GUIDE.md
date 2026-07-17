# Inavora — User Guide

This guide covers what Inavora can actually do today and how to use each feature. (For developer/setup docs — tech stack, install steps, API/socket reference — see the main [README.md](../README.md).)

Inavora is a Mentimeter-style platform: a **presenter** creates a presentation made of interactive slides, starts a **live session**, and an **audience** joins from their phones/laptops using a join code to respond in real time.

---

## 1. Getting Started

### Sign up / Log in
- Go to `/register` to create an account with name, email, and password, or use **Continue with Google**.
- Emails require verification before you can log in: after registering you'll land on a **"Check your inbox"** screen — click the link Firebase emails you, then log in normally. You can resend the email from that screen if it doesn't arrive.
- Forgot your password? Use **Forgot Password** on the login page (OTP-based reset flow).

### Dashboard
Once logged in you land on the **Dashboard**, where all your presentations are listed. From here you can create a new presentation or open/edit an existing one.

---

## 2. Building a Presentation

Open a presentation to enter the **editor**. Add slides from the slide panel; each slide has a type that determines how the audience interacts with it.

### Interactive slide types (collect audience responses)
| Type | What it does |
|---|---|
| **Multiple Choice** | Poll with several options; live vote counts and percentages |
| **Word Cloud** | Free-text answers rendered as a word cloud sized by frequency |
| **Open Ended** | Free-text answers as a list, with optional upvoting |
| **Scales** | Rating scale(s) — supports multiple statements per slide, shows averages/distribution |
| **Ranking** | Audience drags items into their preferred order; shows average rank |
| **Q&A** | Audience submits questions; presenter can mark ones as answered or highlight one as "active" |
| **Guess the Number** | Audience guesses a number; shows the distribution of guesses vs. the correct answer |
| **100 Points** | Audience splits 100 points across a set of options (budget/priority allocation) |
| **2x2 Grid** | Audience places a point on a two-axis grid (e.g. impact vs. effort) |
| **Pin on Image** | Audience clicks a spot on an uploaded image; can be scored against a correct area |
| **Quiz** | Timed, scored multiple-choice question with correct/incorrect feedback |
| **Leaderboard** | Auto-generated ranking after a quiz slide, or a final cumulative leaderboard across all quiz slides |

### Content-only slide types (no audience response)
- **Text**, **Image**, **Video**, **Instruction** — for context, breaks, or instructions between interactive slides.

### Bring-your-own-slides
You can embed existing material instead of building from scratch: **Miro boards**, **PowerPoint**, **Google Slides**, and **PDFs** (PDFs are rendered page-by-page inside the presentation).

---

## 3. Presenting Live

1. Open a presentation and click **Present** to enter **Present Mode**.
2. Share the **join link** or the **6-character access code** shown on screen with your audience (via the Share option). *Note: QR-code sharing isn't available yet — only the code and link.*
3. Use **Next / Previous** to move through slides; the audience's screens update in real time.
4. The live **participant count** is shown at all times; you can **remove (kick)** a disruptive participant from the session.
5. Click **End** to close the session.

---

## 4. Joining as a Participant

- Open the join link (or go to the join page and enter the access code) and type in a display name.
- No account is required to join as a participant.
- Once the presenter starts/advances a slide, it appears automatically on your screen — answer and submit.
- If you see "Waiting for connection," it means the socket/live-connection hasn't been established yet (check your network, or — for developers — that `VITE_SOCKET_URL` points at the right backend port).

---

## 5. Results & Analytics

While presenting (or afterward, from the presentation's **Results** view) you get a chart/visualization tailored to each slide type (bar/pie for MCQ, word cloud, average + distribution for scales, scatter for 2x2 grid, etc.), plus a computed **leaderboard** for quizzes with per-question correctness and response time.

- You can **clear responses** for a slide (or all slides) to reset before re-running a session.
- **Exporting** results to CSV/Excel or PDF is available only on paid plans (Pro, Lifetime, or Institution) — free-plan accounts can view but not export.

---

## 6. Plans & Limits

| Plan | Limits / Perks |
|---|---|
| **Free** | Up to 10 slides per presentation, 20 participants per session |
| **Pro** (monthly/yearly) | Unlimited slides & participants, AI features, exporting, priority support |
| **Lifetime** | One-time payment, same benefits as Pro, forever |
| **Institution** | Organization-wide plan (see below) |

Payments are processed via Razorpay.

---

## 7. Institution Admin

If your organization signs up for an Institution plan, an **Institution Admin** gets a separate dashboard to:
- Add/remove users in bulk (including Excel import), and manage seats
- View all presentations created across the institution, with org-wide analytics
- Customize branding (logo, custom settings)
- Manage API keys and webhooks for integrations
- Build and generate custom reports, view audit logs and security settings
- Manage the institution's subscription, buy additional user seats, and view payment history

Institution registration is a guided flow: choose a plan → pay → verify email (link + OTP) → set a password → done.

---

## 8. Super Admin (internal/operations)

A separate Super Admin panel (`/super-admin`) is for platform operators, not regular users or institution admins. It covers: overall dashboard stats, managing all users and institutions, viewing all payments, platform-wide analytics, moderating presentations, system health monitoring, activity logs, global settings, and managing the **Careers** job board (postings + applications) and **Testimonials** (approve/reject/feature user-submitted testimonials).

---

## 9. Other Pages

- **Careers**: a public job board — view open roles and submit an application (resume, experience, cover letter).
- **Testimonials**: visitors can submit a testimonial (name, rating, text); it only appears publicly after a Super Admin approves it.
- Standard informational pages: About, How It Works, Contact, Privacy Policy, Terms of Service.

---

## 10. Language Support

Inavora's UI is available in 11 languages (English, Hindi, Marathi, Bengali, Tamil, Telugu, Arabic, Spanish, French, Portuguese, Chinese) — switch languages from the language selector in the UI.

---

## Known Gaps (as of this writing)
- No QR-code generation for joining a session — only the text code/link.
- Some legacy slide-type aliases (`pick_answer`, `type_answer`) exist internally alongside Multiple Choice/Open Ended and may be consolidated in the future — you shouldn't need to use them directly.
