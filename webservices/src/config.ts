import dotenv from "dotenv"

dotenv.config();

export default {
    db: {
        host: process.env.MYSQL_HOST || "localhost",
        user: process.env.MYSQL_USER,
        pass: process.env.MYSQL_PASS
    },
    port: Number(process.env.LISTENING_PORT || 8080),

}
