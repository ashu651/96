"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CorrelationIdMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationIdMiddleware = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let CorrelationIdMiddleware = CorrelationIdMiddleware_1 = class CorrelationIdMiddleware {
    constructor() {
        this.logger = new common_1.Logger(CorrelationIdMiddleware_1.name);
    }
    use(req, res, next) {
        const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
        req.headers['x-correlation-id'] = correlationId;
        res.setHeader('X-Correlation-ID', correlationId);
        req.correlationId = correlationId;
        this.logger.log(`${req.method} ${req.url} - Correlation ID: ${correlationId}`, {
            correlationId,
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
        });
        next();
    }
};
exports.CorrelationIdMiddleware = CorrelationIdMiddleware;
exports.CorrelationIdMiddleware = CorrelationIdMiddleware = CorrelationIdMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], CorrelationIdMiddleware);
//# sourceMappingURL=correlation-id.middleware.js.map