// configure your variables here

var config = {};

config.opentok = {};
config.db = {};
config.web = {};
config.middleware = {};

// OpenTok Credentials
config.opentok.key = process.env.TB_KEY || "45458482";
config.opentok.secret = process.env.TB_SECRET || "4c0d3f2bbea171c83d481153e584fa14b930c6f8";

// Database configuration.
config.db.redis = false;
config.db.REDISTOGO_URL = process.env.REDISTOGO_URL;

// optional middleware to support
config.middleware.p2p = /^\/.*p2p[^\/.]*(\.json)?$/; // urls matching reges will have p2p enabled sessions. Set to false to disable
config.middleware.json = /.*\.json$/; // urls matching regex will have json responses. Set to false to disable
config.middleware.reservations = [{ // reserved rooms. If you want specific rooms to use different opentok Credentials, set it here
	key: process.env.TNW_KEY,
	secret: process.env.TNW_SECRET,
	roomName: "agilityfeat"
}]; // reserved rooms. set to false to disable

config.web.port = process.env.PORT || 9393;
config.web.env = process.env.NODE_ENV || "development"; // environment, could be change to production

module.exports = config;