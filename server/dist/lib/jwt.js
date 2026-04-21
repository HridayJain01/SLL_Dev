"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = void 0;
exports.setCookieToken = setCookieToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signToken = (id) => jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
exports.signToken = signToken;
function setCookieToken(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
//# sourceMappingURL=jwt.js.map