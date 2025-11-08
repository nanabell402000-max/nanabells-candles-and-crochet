import React, { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState("");

  // ---- Editable brand + integrations ----
  const brand = {
    name: "Nanabell's Candles and Crochet",
    tagline: "Hand-poured scents & heirloom crochet pieces",
    email: "hello@example.com", // used for mailto fallback
    instagram: "https://instagram.com/crochetallday",
    etsy: "https://etsy.com/shop/yourshop",
    ravelry: "https://www.ravelry.com/advertisers/nanabellscrochetcreations/ads/active",
    location: "Nashville, TN",

    // Prefer environment variables; fall back to literals below if unset
    paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "ARfjlizKcIsDNHT5dBgHL...",

    // EmailJS — create a service + two templates (order_summary, auto_reply) and a public key
    emailjsServiceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || "YOUR_EMAILJS_SERVICE_ID",
    emailjsTemplateId: import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID || "YOUR_EMAILJS_ORDER_TEMPLATE_ID",
    emailjsPublicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_EMAILJS_PUBLIC_KEY",

    // Instagram widget embed (e.g., LightWidget/SnapWidget iframe URL)
    instagramWidgetUrl: "https://snapwidget.com/embed/your-widget-id",
  };

  // ---- Products ----
  const candles = [
    { id: "Diva", name: "Apple Cider & Snickerdoodle", price: "$12", priceNumber: 12, size: "8 oz soy blend", desc: "Warm cinnamon sugar with crisp apple cider.", badge: "Best Seller" },
    { id: "Sleigh Ride", name: "Grace", price: "$12", priceNumber: 12, size: "8 oz soy blend", desc: ,
    { id: "Dior Sauvage", name: "Butt Naked", price: "$12", priceNumber: 12, size: "8 oz soy blend",, badge: "Fresh" },
    { id: "Hawaiian Pink Hibiscus", name: "Baja Cactus Blossom", price: "$12", priceNumber: 12, size: "8 oz soy blend","Fruity Rings", "Tobacco Caramel", "Sweet Grace", "Japanese Cherry Blossom", "Fresh Brewed Coffee",
  ];

  const crochet = [
    { id: "crochet-bucket-cloche", name: "Christmas Hat", price: "$15", priceNumber: 28, sizes: "Infant–Adult", desc: "Classic Christmas Hat with Pompons" },
    { id: "crochet-shell-tote", name: "Cloche Hat", price: "$12", priceNumber: 12, sizes: "One size", desc: "Roomy market tote with shell edge." },
    { id: "crochet-sun-hat-bow", name: "Sun Hat with Bow", price: "$12", priceNumber: 12, sizes: "Toddler–Adult", desc: "Sweet scallop edge and ribbon bow." },
    { id: "crochet-football-beanie", name: "Football Beanie", price: "$12", priceNumber: 12, sizes: "0–3 mo to Child", desc: "Team-spirited hat with optional earflaps." },
  ];

  // ---- PayPal loader ----
  const paypalLoadedRef = useRef(false);
  useEffect(() => {
    if (paypalLoadedRef.current) return;
    const id = brand.paypalClientId;
    if (!id || id.includes("...")) {
      console.warn("PayPal client ID missing or placeholder. Buttons will not load until a valid ID is set.");
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${id}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => { paypalLoadedRef.current = true; };
    document.body.appendChild(script);
  }, [brand.paypalClientId]);

  // Render PayPal button for a single item
  function PayPalButton({ item }) {
    const btnRef = useRef(null);

    useEffect(() => {
      let isMounted = true;
      const interval = setInterval(() => {
        // wait for window.paypal to exist
        if (window.paypal && btnRef.current && isMounted) {
          clearInterval(interval);
          btnRef.current.innerHTML = "";
          window.paypal
            .Buttons({
              style: { layout: "vertical", shape: "pill", label: "paypal" },
              createOrder: (data, actions) =>
                actions.order.create({
                  purchase_units: [
                    {
                      reference_id: item.id,
                      description: item.name,
                      amount: { currency_code: "USD", value: item.priceNumber.toFixed(2) },
                    },
                  ],
                }),
              onApprove: async (data, actions) => {
                const details = await actions.order.capture();
                alert(`Thank you! Payment received for ${item.name}. Order: ${details.id}`);
              },
              onError: (err) => {
                console.error(err);
                alert("PayPal error — try again or contact us.");
              },
            })
            .render(btnRef.current);
        }
      }, 200);
      return () => { isMounted = false; clearInterval(interval); };
    }, [item.id, item.name, item.priceNumber]);

    return <div className="mt-3" ref={btnRef} />;
  }

  // ---- Contact form (EmailJS) ----
  const formRef = useRef(null);
  async function handleSubmit(e) {
    e.preventDefault();
    if (!brand.emailjsServiceId || !brand.emailjsTemplateId || !brand.emailjsPublicKey ||
        brand.emailjsServiceId.includes("YOUR_") || brand.emailjsTemplateId.includes("YOUR_") || brand.emailjsPublicKey.includes("YOUR_")) {
      alert("Email service not configured yet. Add your EmailJS IDs in the .env or brand config.");
      return;
    }
    const formData = new FormData(formRef.current);
    const payload = Object.fromEntries(formData.entries());

    try {
      setSending(true);
      setSentMsg("");
      // send order summary to you
      await emailjs.send(
        brand.emailjsServiceId,
        brand.emailjsTemplateId,
        {
          from_name: payload.name,
          reply_to: payload.contact,
          order_type: payload.type,
          message: payload.details,
          to_email: brand.email,
        },
        { publicKey: brand.emailjsPublicKey }
      );
      // Auto-reply: uncomment and configure template if desired
      // await emailjs.send(brand.emailjsServiceId, import.meta.env.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID, { to_email: payload.contact, from_name: brand.name }, { publicKey: brand.emailjsPublicKey });
      setSentMsg("Thanks! Your request was sent. We also emailed you a confirmation.");
      formRef.current.reset();
    } catch (err) {
      console.error(err);
      setSentMsg("We couldn't send your message. Please email us directly.");
    } finally {
      setSending(false);
    }
  }

  // ---- UI ----
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white grid place-items-center font-bold">NS</div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight text-lg">{brand.name}</div>
              <div className="text-xs text-neutral-500 -mt-0.5">{brand.tagline}</div>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a className="hover:opacity-70" href="#candles">Candles</a>
            <a className="hover:opacity-70" href="#crochet">Crochet</a>
            <a className="hover:opacity-70" href="#gallery">Gallery</a>
            <a className="hover:opacity-70" href="#instagram">Instagram</a>
            <a className="hover:opacity-70" href="#about">About</a>
            <a className="hover:opacity-70" href="#faq">FAQ</a>
            <a className="hover:opacity-70" href="#contact">Contact</a>
          </nav>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden inline-flex items-center gap-2 border rounded-xl px-3 py-2">
            <span className="text-sm">Menu</span>
            <span className={`transition ${mobileOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-neutral-200">
            <div className="max-w-6xl mx-auto px-4 py-3 grid gap-2 text-sm">
              {["#candles","#crochet","#gallery","#instagram","#about","#faq","#contact"].map((href) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className="py-2">
                  {href.replace("#", "").replace(/\\b\\w/g, (c) => c.toUpperCase())}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-100 via-white to-amber-100" />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Handmade warmth for your home and heart.
              </h1>
              <p className="mt-4 text-neutral-700 text-lg">
                Small-batch candles and heirloom-quality crochet—crafted in {brand.location}.
                Shop ready-to-ship or request a custom piece.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#candles" className="px-5 py-3 rounded-2xl bg-neutral-900 text-white font-semibold hover:opacity-90">Shop Candles</a>
                <a href="#crochet" className="px-5 py-3 rounded-2xl border border-neutral-300 font-semibold hover:bg-white">Shop Crochet</a>
                <a href={brand.ravelry} target="_blank" rel="noreferrer" className="px-5 py-3 rounded-2xl border border-neutral-300 font-semibold hover:bg-white">Patterns on Ravelry</a>
              </div>
              <div className="mt-4 text-sm text-neutral-600">Eco-friendly materials • Thoughtful gifts • Made to last</div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl bg-white shadow-2xl p-4 grid place-items-center text-center">
                <div>
                  <div className="text-7xl">🕯️🧶</div>
                  <div className="mt-2 font-semibold">Pour. Stitch. Repeat.</div>
                  <div className="text-neutral-500 text-sm">Handmade in small batches</div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 rotate-[-3deg] bg-black text-white text-xs px-3 py-2 rounded-xl shadow-xl">Woman-owned</div>
              <div className="absolute -top-4 -right-4 rotate-3 bg-amber-400 text-black text-xs px-3 py-2 rounded-xl shadow-xl">Small batch</div>
            </div>
          </div>
        </div>
      </section>

      {/* Candles */}
      <section id="candles" className="py-16 md:py-24 border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Candles</h2>
            <div className="text-sm text-neutral-600">Soy blend • Cotton wicks • Clean burn</div>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {candles.map((c) => (
              <div key={c.id} className="rounded-3xl border border-neutral-200 p-5 bg-neutral-50 hover:bg-white hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-lg tracking-tight">{c.name}</h3>
                  <div className="font-bold">{c.price}</div>
                </div>
                <div className="text-xs text-neutral-500 mt-1">{c.size}</div>
                <p className="text-sm text-neutral-700 mt-1">{c.desc}</p>
                {c.badge && (
                  <div className="inline-block mt-3 text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded-xl">{c.badge}</div>
                )}
                <div className="mt-4 flex gap-3 items-center">
                  <a href={brand.etsy} target="_blank" rel="noreferrer" className="text-sm underline">Buy on Etsy</a>
                </div>
                {/* PayPal Smart Button */}
                <PayPalButton item={c} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crochet */}
      <section id="crochet" className="py-16 md:py-24 bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Crochet</h2>
          <p className="text-neutral-700 mt-2">Ready-made pieces and digital patterns.</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {crochet.map((p) => (
              <div key={p.id} className="rounded-3xl border border-neutral-200 bg-white p-5">
                <div className="font-bold text-lg">{p.name}</div>
                <div className="text-neutral-700 text-sm">{p.sizes}</div>
                <div className="mt-1 font-semibold">{p.price}</div>
                <p className="text-sm text-neutral-600 mt-1">{p.desc}</p>
                <div className="mt-4 flex gap-3 items-center">
                  <a href={brand.etsy} target="_blank" rel="noreferrer" className="text-sm underline">Buy on Etsy</a>
                  <a href={brand.ravelry} target="_blank" rel="noreferrer" className="text-sm underline">Patterns on Ravelry</a>
                </div>
                {/* PayPal Smart Button for physical crochet items */}
                <PayPalButton item={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-16 md:py-24 bg-white border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Gallery</h2>
          <p className="text-neutral-700 mt-2">A peek at recent pours and stitches.</p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {["🕯️","🧶","🧵","🕯️","🧶","🕯️","🧶","🕯️"].map((icon, i) => (
              <div key={i} className="aspect-square rounded-2xl border border-neutral-200 bg-neutral-50 grid place-items-center text-4xl">{icon}</div>
            ))}
          </div>
          <div className="mt-6 text-sm text-neutral-600">Replace these with your product photos for instant polish.</div>
        </div>
      </section>

      {/* Instagram feed embed */}
      <section id="instagram" className="py-16 md:py-24 bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Instagram</h2>
          <p className="text-neutral-700 mt-2">Follow along for new scents, drops, and behind-the-scenes.</p>
          <div className="mt-6 rounded-3xl overflow-hidden border border-neutral-200 bg-white">
            {/* Replace src with your LightWidget/SnapWidget URL */}
            <iframe
              title="Instagram Feed"
              src={brand.instagramWidgetUrl}
              className="w-full h-[500px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="mt-3 text-sm">
            <a className="underline" href={brand.instagram} target="_blank" rel="noreferrer">@ Follow us on Instagram</a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-24 bg-white border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">About {brand.name}</h2>
            <p className="mt-4 text-neutral-700">
              We craft small-batch candles and crochet pieces with timeless style and everyday practicality. Our scents are
              inspired by memory—apple pies, fresh linens, Sunday coffee—while our crochet blends classic techniques with
              modern comfort. Every order is poured or stitched by hand in {brand.location}.
            </p>
            <ul className="mt-4 space-y-2 text-neutral-800">
              <li>• Clean ingredients and quality fibers</li>
              <li>• Thoughtful packaging, gift-ready</li>
              <li>• Custom requests welcome</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-neutral-200 p-8 bg-white grid place-items-center text-6xl">✨</div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">FAQ</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {[
              { q: "What wax do you use?", a: "Natural soy blend with cotton wicks for a clean burn." },
              { q: "Do you take custom orders?", a: "Yes—both candles (labels/scents) and crochet (sizes/colors). Use the form below." },
              { q: "Processing times", a: "Ready-to-ship: 2–3 days. Made-to-order: 1–2 weeks depending on queue." },
              { q: "Local pickup?", a: "Yes in Nashville by appointment. We also ship USPS." },
            ].map((f, i) => (
              <div key={i} className="rounded-3xl border border-neutral-200 p-5 bg-white">
                <div className="font-semibold">{f.q}</div>
                <p className="text-sm text-neutral-700 mt-1">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 md:py-24 bg-white border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Contact & Custom Orders</h2>
          <p className="text-neutral-700 mt-2">Tell us what you need—scents, sizes, colors, gift notes.</p>
          <form ref={formRef} onSubmit={handleSubmit} className="mt-8 grid md:grid-cols-2 gap-5">
            <input name="name" className="w-full rounded-2xl border border-neutral-300 px-4 py-3" placeholder="Your Name" required />
            <input name="contact" className="w-full rounded-2xl border border-neutral-300 px-4 py-3" placeholder="Email or Phone" required />
            <input name="type" className="w-full rounded-2xl border border-neutral-300 px-4 py-3 md:col-span-2" placeholder="Order Type (candle scent / crochet item)" />
            <textarea name="details" className="w-full rounded-2xl border border-neutral-300 px-4 py-3 md:col-span-2" placeholder="Details (quantities, sizes, color palette, timeline)"></textarea>
            <div className="md:col-span-2 flex gap-3 items-center">
              <button disabled={sending} className="px-5 py-3 rounded-2xl bg-neutral-900 text-white font-semibold hover:opacity-90 disabled:opacity-60">
                {sending ? "Sending..." : "Send Request"}
              </button>
              <a href={`mailto:${brand.email}`} className="text-sm underline">or email {brand.email}</a>
            </div>
            {sentMsg && <div className="md:col-span-2 text-sm text-emerald-700">{sentMsg}</div>}
          </form>
          <div className="mt-4 text-sm text-neutral-600">Prefer to buy now? Visit us on <a className="underline" href={brand.etsy} target="_blank" rel="noreferrer">Etsy</a> or <a className="underline" href={brand.ravelry} target="_blank" rel="noreferrer">Ravelry</a>.</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 gap-6 items-center">
          <div className="text-sm text-neutral-600">
            © {new Date().getFullYear()} {brand.name} — {brand.location}
          </div>
          <div className="flex gap-4 sm:justify-end text-sm">
            <a href={brand.instagram} className="underline" target="_blank" rel="noreferrer">Instagram</a>
            <a href={brand.etsy} className="underline" target="_blank" rel="noreferrer">Etsy</a>
            <a href={brand.ravelry} className="underline" target="_blank" rel="noreferrer">Ravelry</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
