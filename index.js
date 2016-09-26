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
            evaluateCommand(event.sender.id, event.message.text);
        } else if (event.postback) {
            // Abbiamo ricevuto una postback
            if(event.postback.payload == "start") {
                sendHelpMessage(event.sender.id)
            } else {
                console.log("POSTBACK: " + JSON.stringify(event));
            }
        } else if (event.message && event.message.attachments) {
            // Gestione degli allegati
            sendTextMessage(event.sender.id, "Mi spiace, non posso gestire allegati!");
        }
    }
    res.sendStatus(200);
});

// Invia un messaggio di testo
function sendTextMessage(recipientId, text) {
    var msg = {
        "text": text
    };
    sendMessage(recipientId, msg)
}

// Sending a multimedia message
function sendMultimediaMessage(recipientId, type, url) {
    var msg = {
        "attachment": {
            "type": type,
            "payload": {
                "url": url
            }
        }
    };    

    sendMessage(recipientId, msg);
}

// Invia un messaggio generico
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

// Messaggi personalizzati
function sendHelpMessage(recipientId) {
    sendTextMessage(recipientId, "Digita FILM per visualizzare i film in programma, digita AIUTO per visualizzare di nuovo questo messaggio.");
}

// Gestione dei comandi
function evaluateCommand(recipientId, text) {
    command = text.toLowerCase();
    console.log("Comando ricevuto: " + command);
    if(command == "aiuto") {
        sendHelpMessage(recipientId)
    } else if(command == "film") {
        sendTextMessage(recipientId, "Ecco i film in programma questa settimana")
        sendMovies(recipientId);
    } else {
        sendTextMessage(recipientId, "Mi spiace, non ho capito :-(");
        sendHelpMessage(recipientId);                
    }
}

// Invia la lista dei film in programmazione
function sendMovies(recipientId) {
    var msg = {
    "attachment": {
        "type": "template",
        "payload": {
            "template_type": "generic",
            "elements": [{
                "title": "Avatar",
                "item_url": "https://www.example.com",
                "image_url": "https://www.example.com/image.jpg",
                "subtitle": "Avatar, al cinema dal 30 settembre",
                "buttons": [{
                    "type": "web_url",
                    "url": "https://www.example.com",
                    "title": "Visualizza sito"
                }, {
                    "type": "postback",
                    "title": "Prenota",
                    "payload": "prenota avatar"
                }]
            }, {
                "title": "Ironman",
                "item_url": "https://www.example.com",
                "image_url": "https://www.example.com/image.jpg",
                "subtitle": "Ironman, al cinema dal 25 settembre",
                "buttons": [{
                    "type": "web_url",
                    "url": "https://www.example.com",
                    "title": "Visualizza sito"
                }, {
                    "type": "postback",
                    "title": "Prenota",
                    "payload": "prenota ironman"
                }]
            }]
        }
    }}; 

    sendMessage(recipientId, msg);
}