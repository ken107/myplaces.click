import assert from "assert"
import bodyParser from "body-parser"
import cors from "cors"
import express from "express"
import config from "./config"
import * as db from "./db"
import {groupBy} from "./utils"


const app = express();
app.set("trust proxy", 1);
app.use(cors(), bodyParser.json());
app.get("/", (req, res) => res.end("Good"));
app.get("/shutdown", shutdown);
app.get("/get-test-locations", getTestLocations);
app.get("/get-tags", getTags);
app.post("/add-test-location", addTestLocation);
app.post("/add-user-submission", addUserSubmission);
const server = app.listen(config.port, () => console.log("Server started on", config.port));



function shutdown(req: express.Request, res: express.Response) {
    if (!req.ip.endsWith("127.0.0.1")) return res.sendStatus(404);
    res.end("OK");
    setTimeout(shutdownNow, 1000);
}

function shutdownNow() {
    console.log("Shutdown requested");
    server.close();
    db.shutdown();
}

async function getTestLocations(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        assert(req.query.northEast && req.query.southWest && req.query.myLocation, "Missing args");

        const result = await db.getTestLocations(req.query.northEast, req.query.southWest, req.query.myLocation);
        if (result.length) {
            const tags = await db.getTestLocationTags(result.map(x => x.id));
            const tagMap = groupBy(tags, x => x.testLocationId);
            for (const item of result) item.tagIds = (tagMap[item.id] || []).map(x => x.tagId);
        }
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}

async function getTags(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        res.json(await db.getTags());
    }
    catch (err) {
        next(err);
    }
}

async function addTestLocation(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        assert(req.body.name && req.body.lat && req.body.lng && req.body.source && req.body.sourceUrl && req.body.tagIds, "Missing args");
        assert(req.body.tagIds.length < 20, "Too many tagIds");

        await db.insertTestLocation(req.body);
        res.end();
    }
    catch (err) {
        next(err);
    }
}

async function addUserSubmission(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        assert(req.body.source, "Missing args");

        await db.insertUserSubmission(req.body.source, req.body.email);
        res.end();
    }
    catch (err) {
        next(err);
    }
}
