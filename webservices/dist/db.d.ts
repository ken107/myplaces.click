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
    contributorEmail: string;
    tagIds: number[];
}
interface TagDAO {
    id: number;
    name: string;
}
export declare function shutdown(): void;
export declare function getTestLocations(northEast: LngLatDAO, southWest: LngLatDAO, myLocation: LngLatDAO): Promise<TestLocationDAO[]>;
export declare function getTestLocationTags(testLocationIds: number[]): Promise<{
    testLocationId: number;
    tagId: number;
}[]>;
export declare function getTags(): Promise<TagDAO[]>;
export declare function insertTestLocation(item: TestLocationDAO): Promise<void>;
export declare function insertUserSubmission(source: string, email: string): Promise<void>;
export declare function insertContactUs(email: string, message: string): Promise<void>;
export {};
