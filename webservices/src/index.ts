import express from "express"
import cors from "cors"
import config from "./config"

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.get("/", (req, res) => res.end("Good"));
app.get("/shutdown", shutdown);
app.get("/get-test-locations", getTestLocations);
const server = app.listen(8080, () => console.log("Server started"));



function shutdown(req: express.Request, res: express.Response) {
    if (!req.ip.endsWith("127.0.0.1")) return res.sendStatus(404);
    res.end("OK");
    setTimeout(shutdownNow, 1000);
}

function shutdownNow() {
    console.log("Shutdown requested");
    server.close();
}

function getTestLocations(req: express.Request, res: express.Response) {
    res.json([]);
}
