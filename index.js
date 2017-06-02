var Bandwidth = require("node-bandwidth");
var express = require("express");
var app = express();

var bodyParser = require("body-parser");
var http = require("http").Server(app);
var weather = require("Openweather-Node");
var stringify = require('json-stringify');
var weather = require('openweather-apis');
let NewsAPI = require('newsapi');

 
var weatherinfo;
var weathertemp;

app.use(bodyParser.json());
//use a json body parser
app.set('port', (process.env.PORT || 3000));
//set port to an environment variable port or 3000

weather.setAPPID(process.env.WEATHERAPPID);
weather.setLang('en');
weather.setUnits('imperial');
//set the culture 
//weather.setCulture("fr");
//set the forecast type 

//weather.setForecastType("daily"); //or "" for 3 hours forecast

var client = new Bandwidth({
    // uses my environment variables 
    userId    : process.env.USERID, // <-- note, this is not the same as the username you used to login to the portal
    apiToken  : process.env.APITOKEN,
    apiSecret : process.env.APISECRET
});
var myBWNumber= process.env.BANDWIDTH_PHONE_NUMBER;

var messagePrinter= function (message){

    console.log('Using the message printer');
    console.log(message);

}

app.get("/", function (req, res) {
    console.log(req); 
    res.send("Hi this is Sarah");
    //res.send(can be a website);
});
// weather.now("Raleigh",function(req, res)
// {	

// 	if(req) console.log(req);
// 	else
// 	{
// 		var body = req.body; 
// 		messagePrinter(res);
// 		//console.log(res.getFahrenheitTemp());
				
// 		}

// })
weather.getDescription(function(err, desc){
        console.log(desc);
        weatherinfo = desc;
    });
weather.getTemperature(function(err, temp){
        console.log(temp);
        weathertemp = temp; 
    });





app.post("/call-callback", function(req, res){
    var body = req.body;
    console.log(body);
    sentence = "goodmorning Jillian! Today's weather is " + weatherinfo + "the current tempreture is " + weathertemp + " degrees. You may need your morning cofee because you have many meetings today. Also do not forget to call your grandmother. The current news is bla bla bla. have a great day!";
    res.sendStatus(200);
    if(body.eventType === "answer"){
        client.Call.speakSentence(num, sentence)
        .then(function () {
            console.log("speak sentence sent");
        })
        .catch(function(err){
            console.log(err); //swallowing the error so bad practice
        });

    }
    //hangs up call after sentence
    else if(body.eventType === "speak" && body.state === "PLAYBACK_STOP"){
       client.Call.hangup(body.callId)
       .then(function () {
        console.log("Hanging up call"); 
       })
       .catch(function(err){
         console.log("Error hangign up the call, it was probs already over");
         console.log(err);
       });

    }
    else{
        console.log(body);
    }
})
http.listen(app.get('port'), function(){
    //once done loadin then do this (callback)
    console.log('listening on *:' + app.get('port'));
});


app.post("/outbound-callbacks", function(req, res){
    var body = req.body; 
    var sentence = "goodmorning Jillian! Today's weather is " + weatherinfo + "the current tempreture is " + weathertemp + " degrees. You may need your morning cofee because you have many meetings today. Also do not forget to call your grandmother. The current news is its Steph's birthday!!";
    console.log(body); 
    if(checkIfAnswer(body.eventType)){
        speakSentenceInCall(body.callId, sentence)
        .then(function(response){
            console.log(response);
        })
        .catch(function (error){
            console.log(error);
        });
    }
    else if(isSpeakingDone(body)){
        client.Call.hangup(body.callId)
        .then(function(){
            console.log("Hangup call");
        })
        .catch(function(err){
            console.log("error in hanging up the call");
            console.log(err);
        });
    }

});
//entry point 
app.post("/calls", function(req, res){
    var callbackUrl= getBaseUrl(req) + "/outbound-callbacks";
    var body = req.body;
    var phoneNumber = body.phoneNumber;
    createCallWithCallback(phoneNumber, myBWNumber, callbackUrl)
    .then(function(call){
        console.log(call);
        res.send(call).status(201);
    })
    .catch(function(err){
        console.log("ERR CREATING CALL")
    });

});

var checkIfAnswer = function(eventType){
    return (eventType === "answer");
}

var createCallWithCallback = function(toNumber, fromNumber, callbackUrl){
    return client.Call.create({
        from: fromNumber,
        to: toNumber,
        callbackUrl: callbackUrl


    })
};
var getBaseUrl = function (req) {
    return 'http://' + req.hostname;
};
var speakSentenceInCall = function(callID, sentence){
    return client.Call.speakSentence(callID, sentence);

}
var isSpeakingDone = function(callBackEvent){
    return (callBackEvent.eventType === "speak" && callBackEvent.state === "PLAYBACK_STOP");
}











