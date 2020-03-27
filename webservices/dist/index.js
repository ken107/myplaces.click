"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = express_1.default();
app.set("trust proxy", 1);
app.use(cors_1.default());
app.get("/", (req, res) => res.end("Good"));
app.get("/shutdown", shutdown);
app.get("/get-test-locations", getTestLocations);
const server = app.listen(8080, () => console.log("Server started"));
function shutdown(req, res) {
    if (!req.ip.endsWith("127.0.0.1"))
        return res.sendStatus(404);
    res.end("OK");
    setTimeout(shutdownNow, 1000);
}
function shutdownNow() {
    console.log("Shutdown requested");
    server.close();
}
function getTestLocations(req, res) {
    res.json([]);
}
