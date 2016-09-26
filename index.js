// Inizializziamo i componenti dell'applicazione
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

// La cartella per i file statici
app.use(express.static('public'));

// Il film che abbiamo scelto di prenotare
var filmPrenotato = null;

// Il numero di posti prenotati
var postiPrenotati = 0;

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
            } else if(event.postback.payload.indexOf("prenota") !== -1) {
                getReservation(event);
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

// Invia messaggio multimediale
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

// Messaggio di aiuto
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
        sendTextMessage(recipientId, "Ecco i film in programma questa settimana");
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
                "title": "Casablanca",
                "image_url": "http://cinemabot-ioprogrammo.herokuapp.com/images/casablanca.jpg",
                "subtitle": "Film del 1942 diretto da Michael Curtiz",
                "buttons": [{
                    "type": "web_url",
                    "url": "https://it.wikipedia.org/wiki/Casablanca_(film)#Trama",
                    "title": "Visualizza trama"
                }, {
                    "type": "postback",
                    "title": "Prenota \"Casablanca\"",
                    "payload": "prenota casablanca"
                }]
            }, {
                "title": "Frankenstein",
                "image_url": "http://cinemabot-ioprogrammo.herokuapp.com/images/frankenstein.jpg",
                "subtitle": "Film horror fantascientifico del 1931 diretto da James Whale",
                "buttons": [{
                    "type": "web_url",
                    "url": "https://it.wikipedia.org/wiki/Frankenstein_(film_1931)#Trama",
                    "title": "Visualizza trama"
                }, {
                    "type": "postback",
                    "title": "Prenota \"Frankenstein\"",
                    "payload": "prenota frankenstein"
                }]
            },{
                "title": "Il grande dittatore",
                "image_url": "http://cinemabot-ioprogrammo.herokuapp.com/images/ilgrandedittatore.jpg",
                "subtitle": "Film statunitense del 1940 diretto, prodotto e interpretato da Charlie Chaplin",
                "buttons": [{
                    "type": "web_url",
                    "url": "https://it.wikipedia.org/wiki/Il_grande_dittatore#Trama",
                    "title": "Visualizza trama"
                }, {
                    "type": "postback",
                    "title": "Prenota \"Il grande dittatore\"",
                    "payload": "prenota il_grande_dittatore"
                }]
            }]
        }
    }}; 

    sendMessage(recipientId, msg);
}

// Gestione della prenotazione
function getReservation(event) {
    var film = event.postback.payload.split(" ");
    // Trasformiamo il dato passato dalla postback
    filmPrenotato = film[1].charAt(0).toUpperCase() + film[1].slice(1);
    filmPrenotato = filmPrenotato.replace("_", " ");
    sendSeatRequest(event.sender.id);   
}

function sendSeatRequest(recipientId) {

    var msg = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Quanti posti vuoi prenotare?",
                    "image_url": "http://cinemabot-ioprogrammo.herokuapp.com/images/poltrone.jpg",
                    "subtitle": "Scegli fino ad un massimo di 3 posti prenotabili",
                    "buttons": [{
                        "type": "postback",
                        "title": "1 posto",
                        "payload": "1 posto"
                    },{
                        "type": "postback",
                        "title": "2 posti",
                        "payload": "2 posti"
                    },{
                        "type": "postback",
                        "title": "3 posti",
                        "payload": "3 posti"
                    }]
                }]
            }
    }};
    sendMessage(recipientId, msg);
}
