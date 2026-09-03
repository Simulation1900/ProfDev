# Changelog — Continuing Education Tracker

Records the ongoing professional development of the Simulation Operations team
against a monthly requirement of 2.5 hours each. Maintaining regular continuing
education is both an SSH accreditation requirement and a record worth being able
to produce on request.

Releases are dated. Each entry describes what changed for the people using it,
not the shape of the code.

---

## 2026-09-03 — Shared design language, and two production fixes

### Changed
- **Refreshed into the Simulation Timer's design language**, so the two tools
  read as one system: a single quiet palette, Montserrat at light weights,
  headings separated by letter-spacing rather than bold, translucent panels, and
  figures set in tabular numerals so they do not jitter as they change.
- Dark mode is now stamped on the page before first paint, so a dark-mode user
  no longer gets a white flash on the way in. Existing preferences are migrated
  automatically.
- The charts take their colours from the stylesheet rather than a second
  hardcoded palette, and each doughnut slice uses the colour of the badge that
  category already wears in the log — so the chart and the log cannot drift
  apart.

### Fixed
- **The education log could come up empty on a cold load.** Entries and team
  members are fetched in parallel, but the log groups entries under each member
  and was drawn from the entries fetch alone. When entries arrived first, the
  log rendered nothing while the count claimed six entries, until a filter was
  touched.
- **The webfont was blocked in production.** The site's content-security-policy
  allowed stylesheets only from its own origin, so Google Fonts never loaded and
  the refresh rendered in system fonts.
- **The graphs failed to paint on some machines.** The chart panels carried the
  same backdrop blur as every other panel, and a canvas inside a
  backdrop-filtered element does not composite on some GPUs. The charts now sit
  on an opaque surface.

---

## 2026-03-18 — Faster start

### Changed
- Token verification and the initial data fetches now run at the same time
  rather than in sequence, cutting the wait on a cold start.

---

## 2026-03-16 — Fixes and polish

### Changed
- UX improvements and style elevations throughout.

### Fixed
- A batch of bugs found in daily use, including a broken user-exclusion
  reference left behind by a constant refactor.

---

## 2026-03-13 — Editing and navigation

### Added
- **Edit an entry after submitting it** — date, category, hours and description,
  in a modal, for your own entries.
- A character counter on the description field that warns as it approaches the
  500-character limit.
- Month navigation on the monthly progress chart, so past months can be reviewed
  rather than only the current one.

---

## 2025-11-24 — Sign-in feedback

### Added
- A loading indicator during sign-in, and clearer error messaging — including
  for the cold-start delay when the API has been idle.

---

## 2025-11-20 — Initial release

### Added
- Activity logging against nine categories — webinar, podcast, article, book,
  conference, video, course, professional meeting and other.
- Team education log grouped by member, with per-member monthly progress against
  the 2.5-hour requirement.
- Dashboard: personal hours, team average, team compliance and total activities
  for the month.
- Monthly progress and activity category charts.
- Search and filtering by member, category and date range, with quick filters.
- CSV export of the filtered log.
- Dark mode.
- Sign-in with existing OvertimeTracker credentials.
- Azure Static Web App frontend with an Azure Functions API.
