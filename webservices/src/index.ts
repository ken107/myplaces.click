import assert from "assert"
import bodyParser from "body-parser"
import cors from "cors"
import express from "express"
import config from "./config"
import * as dbs from "./dbs"


const app = express();
app.set("trust proxy", 1);
app.use(cors(), bodyParser.json());
app.get("/", (req, res) => res.end("Good"));
app.get("/shutdown", shutdown);
app.get("/get-test-locations", getTestLocations);
app.post("/add-test-location", addTestLocation);
const server = app.listen(config.port, () => console.log("Server started on", config.port));
const db = dbs.getConnection("testingmap");



function shutdown(req: express.Request, res: express.Response) {
    if (!req.ip.endsWith("127.0.0.1")) return res.sendStatus(404);
    res.end("OK");
    setTimeout(shutdownNow, 1000);
}

function shutdownNow() {
    console.log("Shutdown requested");
    server.close();
    dbs.shutdown();
}

function getTestLocations(req: express.Request, res: express.Response) {
    res.json([]);
}

async function addTestLocation(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        assert(req.body.name && req.body.lat && req.body.lng && req.body.source, "Missing args");
        await db.execute(`
            INSERT INTO testLocations (name, address, address2, city, state, postalCode, countryCode, latLng, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, POINT(?, ?), ?)`, [
                req.body.name,
                req.body.address,
                req.body.address2,
                req.body.city,
                req.body.state,
                req.body.postalCode,
                req.body.countryCode,
                req.body.lat,
                req.body.lng,
                req.body.source
            ]);
        res.end();
    }
    catch (err) {
        next(err);
    }
}
