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
const db = __importStar(require("./db"));
const utils_1 = require("./utils");
const app = express_1.default();
app.set("trust proxy", 1);
app.use(cors_1.default(), body_parser_1.default.json());
app.get("/", (req, res) => res.end("Good"));
app.get("/shutdown", shutdown);
app.get("/get-test-locations", getTestLocations);
app.get("/get-tags", getTags);
app.post("/add-test-location", addTestLocation);
app.post("/add-user-submission", addUserSubmission);
app.post("/contact-us", contactUs);
const server = app.listen(config_1.default.port, () => console.log("Server started on", config_1.default.port));
function shutdown(req, res) {
    if (!req.ip.endsWith("127.0.0.1"))
        return res.sendStatus(404);
    res.end("OK");
    setTimeout(shutdownNow, 1000);
}
function shutdownNow() {
    console.log("Shutdown requested");
    server.close();
    db.shutdown();
}
async function getTestLocations(req, res, next) {
    try {
        assert_1.default(req.query.northEast && req.query.southWest && req.query.myLocation, "Missing args");
        const result = await db.getTestLocations(req.query.northEast, req.query.southWest, req.query.myLocation);
        if (result.length) {
            const tags = await db.getTestLocationTags(result.map(x => x.id));
            const tagMap = utils_1.groupBy(tags, x => x.testLocationId);
            for (const item of result)
                item.tagIds = (tagMap[item.id] || []).map(x => x.tagId);
        }
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function getTags(req, res, next) {
    try {
        res.json(await db.getTags());
    }
    catch (err) {
        next(err);
    }
}
async function addTestLocation(req, res, next) {
    try {
        assert_1.default(req.body.name && req.body.lat && req.body.lng && req.body.source && req.body.sourceUrl && req.body.tagIds, "Missing args");
        assert_1.default(req.body.tagIds.length < 20, "Too many tagIds");
        await db.insertTestLocation(req.body);
        res.end();
    }
    catch (err) {
        next(err);
    }
}
async function addUserSubmission(req, res, next) {
    try {
        assert_1.default(req.body.source, "Missing args");
        await db.insertUserSubmission(req.body.source, req.body.email);
        res.end();
    }
    catch (err) {
        next(err);
    }
}
async function contactUs(req, res, next) {
    try {
        assert_1.default(req.body.email && req.body.message, "Missing args");
        await db.insertContactUs(req.body.email, req.body.message);
        res.end();
    }
    catch (err) {
        next(err);
    }
}
