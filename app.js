// ***
// *** Required modules
// ***
var express			 	= require("express"),
	opentok					= require("opentok"),
	bodyParser			= require("body-parser"),
	cors						= require("cors"),
	actors 					= require("simple-actors"),
	Rx 							= require('rx'),
	RxNode 					= require('rx-node'),
	config 					= require("./config"),
	storage 				= require("./lib/store.js"),
	loadMiddleware	= require("./lib/load-middleware.js");

// ***
// *** OpenTok Constants for creating Session and Token values
// ***
var OTKEY = config.opentok.key;
var ot = new opentok(config.opentok.key, config.opentok.secret);

// ***
// *** Setup Express to handle static files in public folder
// *** Express is also great for handling url routing
// ***
var app = express();
app.set( "views", __dirname + "/views");
app.set( "view engine", "ejs");
app.use(bodyParser());
app.use(express.static(__dirname + "/public"));

// ***
// *** Load middleware
// ***
//app.use(cors({method:"GET"}));
storage.init(config); // setup memory or redis, depending on config
// prevent iframe embedding
app.use(function(req, res, next) {
	res.header("X-Frame-Options", "SAMEORIGIN");
	next();
});
loadMiddleware(app, config);

// ***
// *** When user goes to root directory, render index page
// ***
app.get("/", function(req, res) {
	res.render("index");
});

// ***
// *** When user goes to a room, render the room page
// ***
app.get("/:rid", function(req, res) {
	// final function to be called when all the necessary data is gathered
	var sendRoomResponse = function(apiKey, sessionId, token) {
		var data = {
			rid: rid,
			sid: sessionId,
			apiKey: apiKey,
			token: token
		};
		if (req.format === "json") {
			res.json(data);
		} else{
			res.render("room", data);
		}
	};

	console.log(req.url);

	var rid = req.params.rid.split(".json")[0];
	var room_uppercase = rid.toUpperCase();

	// When a room is given through a reservation
	if (req.sessionId && req.apiKey && req.token) {
		sendRoomResponse(req.apiKey, req.sessionId, req.token);
	} else {
		// Check if room sessionId exists. If it does, render response. If not, create sesionId
		storage.get(room_uppercase, function(reply) {
			if (reply) {
				req.sessionId = reply;
				sendRoomResponse(OTKEY, req.sessionId, ot.generateToken(req.sessionId, {role: "moderator"}));
			} else {
				ot.createSession(req.sessionProperties || {mediaMode: "routed"}, function(err, session) {
						if (err) {
							if (config.web.env === "development") {
								payload = { error: err.message };
							} else{
								payload = { error: "Could not generate opentok session" };
							}

							return res.send(500, payload);
						}

						storage.set(room_uppercase, session.sessionId, function() {
							sendRoomResponse(OTKEY, session.sessionId, ot.generateToken(session.sessionId, {role: "moderator"}));
						});
				});
			}
		});
	}
});

// ***
// *** Reactive Extension
// ***
var source = Rx.Observable.return(42);

var emitter = RxNode.toEventEmitter(source, 'data');

emitter.on('data', function (data) {
    console.log('Data: ' + data);
});

emitter.on('end', function () {
    console.log('End');
});

// Ensure to call publish to fire events from the observable
emitter.publish();


// ***
// *** start server, listen to port (predefined or 9393)
// ***
app.listen(config.web.port, function() {
	console.log("application now served on port " + config.web.port + " in " + config.web.env + " environment");
});