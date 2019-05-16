const express = require('express')
var bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
const port = 3000

var Request = require("request");

const querystring = require('querystring');
const stripe = require("stripe")("_secret");


app.use(cors())
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.get('/', (req, res) => res.send('Hello World!'))

app.get('/cities/covered', (req, res) => {
        
        Request.get("Actual Server URL/cities/covered", (error, response, body) => {
            if(error) {
                return console.dir(error);
            }
            res.json({cities : JSON.parse(body)});
        });
    }
)

app.get('/prices', (req, res) => {
        
        console.log(req.query);
        const urlQueryString = querystring.stringify(req.query);
        Request.get("Actual Server URL/prices?" + urlQueryString , (error, response, body) => {
            if(error) {
                return console.dir(error);
            }
            res.json({price : JSON.parse(body)['price']});
        });
    }
)


app.post('/payment/create', (req, res) => {
        
    console.log(req.body);

    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here: https://dashboard.stripe.com/account/apikeys

    let priceToBeCharged = parseInt(req.body.amount);
    priceToBeCharged = priceToBeCharged.toFixed(2)*100;
    
    (async () => {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: priceToBeCharged,
            currency: req.body.currency
        });
        res.json({client_secret : paymentIntent.client_secret});
        // console.log(paymentIntent);
    })();
});


app.post('/payment/update', (req, res) => {
        
    console.log(req.body);

    let priceToBeCharged = parseInt(req.body.amount);
    priceToBeCharged = priceToBeCharged.toFixed(2)*100;

    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here: https://dashboard.stripe.com/account/apikeys
    
    (async () => {
        const paymentIntent = await stripe.paymentIntents.update(
            req.body.payId,
            {  amount: priceToBeCharged });
        // console.log(paymentIntent);
        res.json({client_secret : paymentIntent.client_secret});
    })();
});



app.post('/bookings/create/success', (req, res) => {
        
    //console.log(req.body);
    let tenant0 = req.body['tenant0'];
    console.log(tenant0);

    Request.post("Actual Server URL/bookings/create/success", { json : req.body }, (error, response, body) => {
        if(error) {
            return console.dir(error);
        }
        res.json(body);
    });
});





app.listen(port, () => console.log(`Example app listening on port ${port}!`))
