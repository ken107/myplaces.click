"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbs = __importStar(require("./dbs"));
const con = dbs.getConnection("testingmap");
function shutdown() {
    dbs.shutdown();
}
exports.shutdown = shutdown;
async function getTestLocations(northEast, southWest, myLocation) {
    return await con.execute(`SELECT
            id,
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
            sourceUrl,
            isVerified
        FROM
            testLocations
        WHERE
            MBRCovers( ST_SRID( MultiPoint( Point(?,?), Point(?,?) ), 4326 ), lngLat )`, [
        myLocation.lng,
        myLocation.lat,
        northEast.lng,
        northEast.lat,
        southWest.lng,
        southWest.lat
    ]);
}
exports.getTestLocations = getTestLocations;
async function getTestLocationTags(testLocationIds) {
    const placeholders = new Array(testLocationIds.length).fill("?").join(",");
    return await con.execute("SELECT testLocationId, tagId FROM testLocationTags WHERE testLocationId IN (" + placeholders + ")", testLocationIds);
}
exports.getTestLocationTags = getTestLocationTags;
async function getTags() {
    return await con.execute("SELECT id, name FROM tags", []);
}
exports.getTags = getTags;
async function insertTestLocation(item) {
    const result = await con.execute(`
        INSERT INTO testLocations (name, address, address2, city, state, postalCode, countryCode, phone, lngLat, source, sourceUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ST_SRID(POINT(?,?), 4326), ?, ?)`, [
        item.name,
        item.address,
        item.address2,
        item.city,
        item.state,
        item.postalCode,
        item.countryCode,
        item.phone,
        item.lng,
        item.lat,
        item.source,
        item.sourceUrl
    ]);
    const testLocationId = result.insertId;
    const placeholders = new Array(item.tagIds.length).fill("(?, ?)").join(", ");
    const values = item.tagIds.reduce((agg, x) => (agg.push(testLocationId, x), agg), []);
    await con.execute("INSERT INTO testLocationTags (testLocationId, tagId) VALUES " + placeholders, values);
}
exports.insertTestLocation = insertTestLocation;
async function insertUserSubmission(source, email) {
    await con.execute("INSERT INTO userSubmissions (source, email) VALUES (?, ?)", [source, email]);
}
exports.insertUserSubmission = insertUserSubmission;
async function insertContactUs(email, message) {
    await con.execute("INSERT INTO contactUs (email, message) VALUES (?, ?)", [email, message]);
}
exports.insertContactUs = insertContactUs;
