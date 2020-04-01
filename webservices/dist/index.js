"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config"));
const dbs = __importStar(require("./dbs"));
const app = express_1.default();
app.set("trust proxy", 1);
app.use(cors_1.default(), body_parser_1.default.json());
app.get("/", (req, res) => res.end("Good"));
app.get("/shutdown", shutdown);
app.get("/get-test-locations", getTestLocations);
app.post("/add-test-location", addTestLocation);
app.post("/add-user-submission", addUserSubmission);
const server = app.listen(config_1.default.port, () => console.log("Server started on", config_1.default.port));
const db = dbs.getConnection("testingmap");
function shutdown(req, res) {
    if (!req.ip.endsWith("127.0.0.1"))
        return res.sendStatus(404);
    res.end("OK");
    setTimeout(shutdownNow, 1000);
}
function shutdownNow() {
    console.log("Shutdown requested");
    server.close();
    dbs.shutdown();
}
async function getTestLocations(req, res, next) {
    try {
        assert_1.default(req.query.northEast && req.query.southWest && req.query.myLocation, "Missing args");
        const result = await db.execute(`
            SELECT id,
                name,
                address,
                address2,
                city,
                state,
                postalCode,
                countryCode,
                phone,
                ST_Latitude(lngLat) AS lat,
                ST_Longitude(lngLat) AS lng,
                ST_Distance(lngLat, ST_SRID(POINT(?,?), 4326)) AS distance,
                source,
                sourceUrl
            FROM
                testLocations
            WHERE
                MBRCovers( ST_SRID( MultiPoint( Point(?,?), Point(?,?) ), 4326 ), lngLat )
            `, [
            req.query.myLocation.lng,
            req.query.myLocation.lat,
            req.query.northEast.lng,
            req.query.northEast.lat,
            req.query.southWest.lng,
            req.query.southWest.lat
        ]);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function addTestLocation(req, res, next) {
    try {
        assert_1.default(req.body.name && req.body.lat && req.body.lng && req.body.source && req.body.sourceUrl, "Missing args");
        await db.execute(`
            INSERT INTO testLocations (name, address, address2, city, state, postalCode, countryCode, phone, lngLat, source, sourceUrl)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ST_SRID(POINT(?,?), 4326), ?, ?)
            `, [
            req.body.name,
            req.body.address,
            req.body.address2,
            req.body.city,
            req.body.state,
            req.body.postalCode,
            req.body.countryCode,
            req.body.phone,
            req.body.lng,
            req.body.lat,
            req.body.source,
            req.body.sourceUrl
        ]);
        res.end();
    }
    catch (err) {
        next(err);
    }
}
async function addUserSubmission(req, res, next) {
    try {
        assert_1.default(req.body.source, "Missing args");
        await db.execute("INSERT INTO userSubmissions (source, email) VALUES (?, ?)", [req.body.source, req.body.email]);
        res.end();
    }
    catch (err) {
        next(err);
    }
}
