"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = {
    db: {
        host: process.env.MYSQL_HOST || "localhost",
        user: process.env.MYSQL_USER,
        pass: process.env.MYSQL_PASS,
        charset: "utf8mb4",
        timezone: "UTC" //must match @@system_time_zone for correct TIMESTAMP to JS Date conversion
    },
    port: Number(process.env.LISTENING_PORT || 8080),
};
