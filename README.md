# BookCycle

BookCycle is a responsive browser MVP for a pre-owned book marketplace in Bangladesh.

## Implemented MVP

- Browse a seeded catalog of books with keyword, category, condition, and location filters.
- Register and log in with email and password.
- View book details and send a purchase request to a seller.
- Save favorite books for later.
- Add books to a shopping cart with quantity controls and a running total.
- Remove individual items, clear the cart, and submit a demo checkout request.
- Create and remove personal book listings.
- View dashboard statistics, listings, messages, and purchase activity.
- Store the demo account, catalog changes, messages, and purchase requests in `localStorage`.
- Responsive layout for desktop, tablet, and mobile browser widths.

## Run locally

No package installation or build step is required. Open [index.html](./index.html) in a modern browser.

For a local static server, run one of the following from this directory:

```text
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Demo behavior and next integration step

This repository started without an existing backend, so the MVP uses browser storage and intentionally does not claim to provide production authentication, image uploads, real-time delivery, or payment processing. The UI and domain state are organized around the SRS flows; the next production step is replacing the persistence helpers in `app.js` with HTTPS API calls backed by JWT authentication, MongoDB, object storage for images, and a real-time messaging service.
