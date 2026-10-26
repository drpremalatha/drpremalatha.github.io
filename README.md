# Dr. Premalatha A. K. - website

A static one-page site (plain HTML + CSS + a little JS, no build step) for
Dr. Premalatha A. K., BAMS - Senior Ayurveda Physician, Vayas Holistic Ayurveda
Centre, Attappadi, Palakkad.

## Run it locally

Double-click `index.html`, or:

```sh
python3 -m http.server 8000     # then open http://localhost:8000
```

## Files

```
index.html                 the main page (one page, anchored sections)
book.html                  the booking flow: slot -> details -> pay & confirm
assets/css/style.css       all styles; colours are in the :root block at the top
assets/js/main.js          mobile menu + footer year
assets/js/booking.js       slot generation, time zones, WhatsApp message (CONFIG at the top)
assets/img/dr-premalatha.jpg     cover portrait (desk photo, cropped 4:5)
assets/img/at-work.jpg           wide photo band (at her desk)
.nojekyll                  tells GitHub Pages to serve the files as-is
```

## Before it goes live - checklist

Content already taken from her résumé (name, degree, college, dates, posts,
languages, phone, email) is accurate. These still need her confirmation:

- [ ] **Full clinic address + PIN** for Vayas Holistic Ayurveda Centre (`#contact`)
- [ ] **Fees** - ₹500 / ₹300 / ₹400 and US$30 / US$20 are my suggestions, not her prices
- [ ] **UPI ID** - the `#pay` card still says `yourname@okaxis`
- [ ] **UPI QR code** - save her Google Pay QR as `assets/img/upi-qr.png`
- [ ] **A way to be paid from abroad** - PayPal, Wise or an international bank
      transfer. UPI does not work outside India, so without one of these the
      overseas fees on the page cannot actually be collected.
- [ ] **Treatments list** - trim/extend the six cards to match what she actually treats
- [ ] **WhatsApp** - confirm +91 96450 13429 is on WhatsApp, or delete that row
- [ ] **Payment methods** - "Cash & UPI" is a guess (`#about`, Good to know card)
- [ ] **FAQ answers** - read through with her; they are written in her voice but unverified
- [ ] **Google Maps embed** - replace the dashed placeholder box in `#contact`
- [ ] **Centre name** - the WhatsApp photos show a sign reading **"Ayurmana
      Treatment Centre"**, but the résumé (and you) say she is at **Vayas Holistic
      Ayurveda Centre**. The site currently says Vayas everywhere. Confirm which
      name should appear, and whether the two are related.

Every one of these is marked with a `TODO` comment in `index.html`:

```sh
grep -n "TODO" index.html
```

**Not on the site, deliberately:** date of birth, marital status and the
residential address at Chithira (HO), Kottapuram - those are on the résumé but
have no business on a public page. Patient testimonials were also left out;
add them only with written consent.

## Booking

`book.html` is a three-step flow: choose a slot, give a few details, pay and
confirm. It runs entirely in the browser - no server, no accounts.

**Her hours live in one place:** `CONFIG.hours` at the top of
`assets/js/booking.js`. Currently Mon-Sat, 08:00-18:00 IST, in 30-minute slots,
closed Sunday. `slotMinutes`, `leadHours` (no bookings within 12 hours) and
`daysAhead` (3 weeks of calendar) sit beside it, as do the fees, her UPI ID and
her PayPal handle. Change them there and both the page and the WhatsApp message
follow.

**Time zones are handled.** Slots are generated in IST and shown with the
visitor's own time underneath, detected from their browser. An overseas patient
sees "10:00 am / 12:30 AM your time" and picks with their eyes open. The
India/Outside India payment choice is pre-selected the same way.

**What it cannot do:** it does not know what is already booked, so two people
can request the same slot. That is why the last step says she confirms
personally and will offer the nearest free time. For a solo practice that is
usually fine. If it stops being fine, see the note on dynamic hosting below.

**Payment details only appear at step 3**, after a slot is chosen - they are
deliberately not on the main page.

Still placeholders, highlighted yellow so they cannot go live unnoticed:

- **Her UPI ID** - `CONFIG.upi`, currently `yourname@okaxis`
- **Her PayPal** - `CONFIG.paypal`, currently `paypal.me/herhandle`
- **The UPI QR** - save her Google Pay QR as `assets/img/upi-qr.png`, then
  replace the dashed placeholder in `book.html` with the commented `<img>` tag
  just above it

Fees: ₹500 / ₹300 / ₹400 in India, US$30 / US$20 / US$25 from abroad. Indian
listings run ₹100-300 for a routine online consult and ₹750-2,000 at
established clinics; individual Indian physicians consulting internationally
charge about US$20-55. Both sets are my suggestions, not her prices.

## Publishing on GitHub Pages (when the account is ready)

1. Create a repo - name it `premalatha.github.io` for a site at
   `https://<username>.github.io`, or any name for `https://<username>.github.io/<repo>/`.
2. Upload these files (the repo root must contain `index.html`).
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `root` → **Save**.
4. The site is live in a minute or two. A custom domain (e.g. `drpremalatha.in`)
   can be added on the same Settings → Pages screen.

All paths in the HTML are relative, so it works at either URL shape without edits.

## Photos

The cover portrait is cropped from `WhatsApp Image 2026-10-24 at 22.25.39 (1).jpeg`
(her consulting desk); the wide band image is the landscape desk shot from the same set. The originals are untouched - to swap in a different one,
crop it to roughly 4:5 (portrait) and save it over
`assets/img/dr-premalatha.jpg`. Her résumé also contains a formal studio
portrait if a more official look is wanted.

The full-length shots at the centre entrance were left out because the signage
in them reads "Ayurmana Treatment Centre", which doesn't match the centre named
in the text.

## Note on `premalatha_resume.docx`

Her résumé is in this folder and is listed in `.gitignore` so it is **not**
published. It contains her date of birth and home address - keep it out of the
repo.

## If she outgrows a static site

GitHub Pages serves files; it runs no code. Everything dynamic here happens in
the visitor's browser, which is why the booking page can show slots but cannot
hold them.

The moment any of these matters, the site needs something more than Pages:

| Want | Why Pages can't | What to add |
|---|---|---|
| A slot disappears once booked | Needs shared state between visitors | Cal.com or Calendly embed (free tier), or Google Calendar appointment schedules |
| Card payment taken at booking | Needs a secret key kept off the page | Razorpay or Stripe payment links; Cal.com can require payment before confirming |
| A form that emails her | Needs a server to send mail | Formspree, Netlify Forms, or Google Forms |
| Patient records, prescriptions | Needs a database and real security | A practice-management service, not a hand-built site |

The cheapest first step by far is a **Cal.com or Calendly embed** on
`book.html`. It brings real availability, prevents double-booking, syncs to her
own calendar, sends reminders, handles time zones, and can collect the fee
before confirming - while the rest of the site stays exactly as it is on
GitHub Pages, free. Only swap the hand-built slot picker for it when the
double-booking risk becomes real.

If the site itself ever needs a server (logins, records, anything with a
database), Pages is the wrong host and Netlify, Vercel or Cloudflare Pages with
functions would replace it. Nothing on this site needs that today.
