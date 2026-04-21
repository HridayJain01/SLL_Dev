"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const user_routes_js_1 = __importDefault(require("./routes/user.routes.js"));
const book_routes_js_1 = __importDefault(require("./routes/book.routes.js"));
const category_routes_js_1 = __importDefault(require("./routes/category.routes.js"));
const membership_routes_js_1 = __importDefault(require("./routes/membership.routes.js"));
const borrow_routes_js_1 = __importDefault(require("./routes/borrow.routes.js"));
const notification_routes_js_1 = __importDefault(require("./routes/notification.routes.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const app = (0, express_1.default)();
const allowedOrigins = new Set([
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
].filter(Boolean));
app.use((0, cors_1.default)({
    origin(origin, callback) {
        // Allow non-browser requests and configured browser origins.
        if (!origin || allowedOrigins.has(origin))
            return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/users', user_routes_js_1.default);
app.use('/api/books', book_routes_js_1.default);
app.use('/api/categories', category_routes_js_1.default);
app.use('/api/memberships', membership_routes_js_1.default);
app.use('/api/borrows', borrow_routes_js_1.default);
app.use('/api/notifications', notification_routes_js_1.default);
app.use(errorHandler_js_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map