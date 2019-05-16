# homeCheck

Edit Index.html File - 
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=_key&libraries=places"></script>
Replace _key with Key for your GCP platform. Make an application and enable the Maps and Places API for the APP. 

<script src="https://www.paypal.com/sdk/js?client-id=_key&currency=EUR">
Replace _key with the Paypal Id.
  
Inside main.js 
const config = {
    country: "US",
    currency: "eur",
    paymentMethods: ["card", "sepa_debit"],
    stripeCountry: "DE",
    stripePublishableKey: "_key"  ( Replace _key with Stripe Public Key, not your secret )  
  }
  
  
From within - server/main.js
const stripe = require("stripe")("_secret"); ( Replace _secret with the Stripe secret key - This is on server side

The frontend is written with JQuery, HTML5, CSS, Bootstrap 3 and Toastr.
The backend is written in Node.js with a Express server. ( If you have a backend written in some other language, replicating the functionalityy of backend here, you would need to replace the appropriate URLs in main.js ( in project root ), essentially replacing "http://localhost:3000/" with your URL.

Uses the PaymentIntent API from Stripe and not the older version.
