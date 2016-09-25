// Inizializziamo i componenti dell'applicazione
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// L'applicazione sarà in ascolto sulla porta 3000 o su una porta predefinita dal server
app.listen((process.env.PORT || 3000));

// Homepage
app.get('/', function (req, res) {
    res.send('<h1>Questo è cinemabot</h1>');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'ciao_io_programmo_come_stai') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Token non valido');
    }
});

// Gestione degli eventi
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            sendMessage(event.sender.id, {text: "Messaggio inviato: " + event.message.text});
        } else if (event.postback) {
            // Abbiamo ricevuto una postback
            console.log("Postback ricevuta: " + JSON.stringify(event));
            sendMessage(event.recipient.id, {text: "Postback: " + event.postback.payload })
        }
    }
    res.sendStatus(200);
});

// Invia un messaggio
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.7/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Errore nella spedizione del messaggio: ', error);
        } else if (response.body.error) {
            console.log('Errore: ', response.body.error);
        }
    });
};