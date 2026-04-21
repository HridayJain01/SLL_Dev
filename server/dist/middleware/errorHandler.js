"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error('Error:', err);
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({ message: `Duplicate value for ${field}` });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid ID format' });
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    res.status(statusCode).json({ message });
}
//# sourceMappingURL=errorHandler.js.map