import dotenv from "dotenv"

dotenv.config();

export default {
    db: {
        host: process.env.MYSQL_HOST || "localhost",
        user: process.env.MYSQL_USER,
        pass: process.env.MYSQL_PASS,
        charset: "utf8mb4",
        timezone: "UTC"   //must match @@system_time_zone for correct TIMESTAMP to JS Date conversion
    },
    port: Number(process.env.LISTENING_PORT || 8080),

}
