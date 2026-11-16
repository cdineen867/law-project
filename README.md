# Aire: trusted babysitters, found in minutes

*Aire* is Irish for care and attention. It's an app that connects parents in Ireland with local babysitters who are Garda vetted, Children First certified and first-aid trained.
This repo holds the project website and a working prototype of the app. It's plain HTML, CSS and JavaScript with no build step.

## Pages
| Page | What's in it |
|---|---|
| `index.html` | Landing page: the problem, how it works, features, pricing, FAQ |
| `safety.html` | Data protection and safeguarding: what we collect, vetting, GDPR, retention, incident response |
| `project.html` | Business case: value proposition, market analysis, competitors, SWOT, business model canvas, export potential |
| `app.html` | The working app |

## The app
Open `app.html#/demo`. To switch between parent and sitter, use the toggle in the sidebar (on mobile, the button in the top bar).
Demo logins use the password `demo123`: `sally@demo.ie` (parent) and `ellie@demo.ie` (sitter).

**Parent screens**
- Find a sitter by date, time, children and age bracket, with filters and a best match.
- Sitter profiles show badges, rates and reviews.
- Book & pay:
  - live price: rate per hour, extra per child, under-2s surcharge, 10% fee
  - Uber ride home for the sitter
  - test card checkout (4242 4242 4242 4242)
- Bookings include in-app chat, cancellation, and ratings after the job.
- Rebook past sitters and keep favourites.
- Profile: children are stored as a nickname and age bracket only. Parents can verify ID and phone, turn on two-factor sign-in, download their data, or delete their account.

**Sitter screens**
- Requests: accept or decline, an "available now" toggle and stats.
- A calendar for setting availability.
- Earnings: a chart, payouts and the subscription.
- Profile: a safety-check centre (ID, Garda vetting, Children First, first aid), with expiry dates and badges removed automatically when something expires. Sitters also set their rates and the age groups they mind.

**Safety rules built into the app**
- A family's full address is shown only to the confirmed sitter, from 48 hours before the booking.
- Phone numbers, emails and requests to pay off the app are hidden in chat.
- Care notes are deleted 30 days after a booking.
- Sitters must be 16 or over, and 16–17 year olds need a guardian's consent.
- An emergency button appears during a live booking, plus a Safety centre for reporting concerns.

### Shared demo data
Every visitor starts from the same data, stored in [`data/demo-data.json`](data/demo-data.json): families, sitters, bookings, reviews, messages and notifications.
- Dates in the file are relative to its `anchor` day and are moved to the visitor's today when they open the app, so upcoming bookings never go out of date.
- To change the data for everyone, edit the file, increase `dataVersion` by 1, then commit and push. Every visitor is reset to the new data the next time they open the app.
- Anything a visitor does after that (bookings, chats, profile edits) is saved only in their own browser's `localStorage`. "Reset demo data" on the Profile page goes back to the shared data.
- Nothing is sent to a server, and no real payments, vetting checks or Uber bookings happen.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Publish on GitHub Pages
Repo **Settings → Pages → Deploy from a branch**, then pick the branch and the `/ (root)` folder.

---
Student project prototype. It is not a live service and not legal advice.
