server side code:
// This test secret API key is a placeholder. Don't include personal details in requests with this key.
// To see your test secret API key embedded in code samples, sign in to your Stripe account.
// You can also find your test secret API key at https://dashboard.stripe.com/test/apikeys.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const app = express();
app.use(express.static('public'));

const YOUR_DOMAIN = 'http://localhost:4242';

app.post('/create-checkout-session', async (req, res) => {
const session = await stripe.checkout.sessions.create({
line_items: [
{
// Provide the exact Price ID (for example, price_1234) of the product you want to sell
price: '{{PRICE_ID}}',
quantity: 1,
},
],
mode: 'payment',
success_url: `${YOUR_DOMAIN}?success=true`,
});

res.redirect(303, session.url);
});

app.listen(4242, () => console.log('Running on port 4242'));

cleint side code:

import React, { useState, useEffect } from "react";
import "./App.css";

const ProductDisplay = () => (

  <section>
    <div className="product">
      <img
        src="https://i.imgur.com/EHyR2nP.png"
        alt="The cover of Stubborn Attachments"
      />
      <div className="description">
      <h3>Stubborn Attachments</h3>
      <h5>$20.00</h5>
      </div>
    </div>
    <form action="/create-checkout-session" method="POST">
      <button type="submit">
        Checkout
      </button>
    </form>
  </section>
);

const Message = ({ message }) => (

  <section>
    <p>{message}</p>
  </section>
);

export default function App() {
const [message, setMessage] = useState("");

useEffect(() => {
// Check to see if this is a redirect back from Checkout
const query = new URLSearchParams(window.location.search);

    if (query.get("success")) {
      setMessage("Order placed! You will receive an email confirmation.");
    }

    if (query.get("canceled")) {
      setMessage(
        "Order canceled -- continue to shop around and checkout when you're ready."
      );
    }

}, []);

return message ? (
<Message message={message} />
) : (
<ProductDisplay />
);
}
