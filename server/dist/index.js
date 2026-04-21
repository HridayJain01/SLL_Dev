"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = __importDefault(require("./app.js"));
const db_js_1 = require("./config/db.js");
const PORT = process.env.PORT || 5000;
(0, db_js_1.connectDB)().then(() => {
    app_js_1.default.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
//# sourceMappingURL=index.js.map