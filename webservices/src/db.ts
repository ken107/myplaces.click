import * as dbs from "./dbs"

interface LngLatDAO {
    lng: number;
    lat: number;
}

interface TestLocationDAO {
    id: number;
    name: string;
    address: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
    phone: string;
    lat: number;
    lng: number;
    distance: number;
    source: string;
    sourceUrl: string;
    tagIds: number[];
}

interface TagDAO {
    id: number;
    name: string;
}


const con = dbs.getConnection("testingmap");

export function shutdown() {
    dbs.shutdown();
}

export async function getTestLocations(northEast: LngLatDAO, southWest: LngLatDAO, myLocation: LngLatDAO): Promise<TestLocationDAO[]> {
    return await con.execute(
        `SELECT
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
            MBRCovers( ST_SRID( MultiPoint( Point(?,?), Point(?,?) ), 4326 ), lngLat )`,
        [
            myLocation.lng,
            myLocation.lat,
            northEast.lng,
            northEast.lat,
            southWest.lng,
            southWest.lat
        ]);
}

export async function getTestLocationTags(testLocationIds: number[]): Promise<{testLocationId: number, tagId: number}[]> {
    const placeholders = new Array(testLocationIds.length).fill("?").join(",");
    return await con.execute(
        "SELECT testLocationId, tagId FROM testLocationTags WHERE testLocationId IN (" + placeholders + ")",
        testLocationIds);
}

export async function getTags(): Promise<TagDAO[]> {
    return await con.execute("SELECT id, name FROM tags", []);
}

export async function insertTestLocation(item: TestLocationDAO): Promise<void> {
    const result = await con.execute(`
        INSERT INTO testLocations (name, address, address2, city, state, postalCode, countryCode, phone, lngLat, source, sourceUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ST_SRID(POINT(?,?), 4326), ?, ?)`,
        [
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
    const testLocationId: number = result.insertId;
    const placeholders = new Array(item.tagIds.length).fill("(?, ?)").join(", ");
    const values = item.tagIds.reduce((agg, x) => (agg.push(testLocationId, x), agg), []);
    await con.execute("INSERT INTO testLocationTags (testLocationId, tagId) VALUES " + placeholders, values);
}

export async function insertUserSubmission(source: string, email: string): Promise<void> {
    await con.execute("INSERT INTO userSubmissions (source, email) VALUES (?, ?)", [source, email]);
}
