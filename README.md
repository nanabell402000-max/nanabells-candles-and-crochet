# Nanabell's Candles and Crochet — Website

A simple React (Vite) site with Tailwind CDN, PayPal Smart Buttons, EmailJS contact form, and Instagram embed slot.

## Quick Deploy on Vercel

1. Create a new Vercel Project and select this folder.
2. Add environment variables (Project Settings → Environment Variables):
   - VITE_PAYPAL_CLIENT_ID
   - VITE_EMAILJS_SERVICE_ID
   - VITE_EMAILJS_ORDER_TEMPLATE_ID
   - VITE_EMAILJS_PUBLIC_KEY
3. Deploy. Your site will build and go live on your Vercel domain.
4. Assign your custom domain: `nanabellscandlesandcrochet.com` in the Domains tab.

> Tailwind is included via CDN in `index.html` for speed. No separate Tailwind build is required.

## Editing Brand Info
Open `src/App.jsx` and edit the `brand` object for name, tagline, social links, and location.

## Notes
- PayPal buttons will not render until a valid **LIVE** PayPal Client ID is provided.
- EmailJS requires an account + templates. Update the env vars above.
- Replace the gallery emoji tiles with your product images.
