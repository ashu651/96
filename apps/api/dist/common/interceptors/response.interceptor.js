"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ResponseInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let ResponseInterceptor = ResponseInterceptor_1 = class ResponseInterceptor {
    constructor() {
        this.logger = new common_1.Logger(ResponseInterceptor_1.name);
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const correlationId = request.headers['x-correlation-id'];
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.map)((data) => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            this.logger.log(`${request.method} ${request.url} - ${response.statusCode} - ${responseTime}ms`, { correlationId });
            response.setHeader('X-Response-Time', `${responseTime}ms`);
            const standardizedResponse = {
                data,
                message: this.getSuccessMessage(request.method, request.url),
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
                ...(correlationId && { correlationId }),
            };
            return standardizedResponse;
        }));
    }
    getSuccessMessage(method, path) {
        const basePath = path.split('/')[1] || 'resource';
        switch (method) {
            case 'GET':
                return `${basePath} retrieved successfully`;
            case 'POST':
                return `${basePath} created successfully`;
            case 'PUT':
                return `${basePath} updated successfully`;
            case 'PATCH':
                return `${basePath} partially updated successfully`;
            case 'DELETE':
                return `${basePath} deleted successfully`;
            default:
                return 'Operation completed successfully';
        }
    }
};
exports.ResponseInterceptor = ResponseInterceptor;
exports.ResponseInterceptor = ResponseInterceptor = ResponseInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], ResponseInterceptor);
//# sourceMappingURL=response.interceptor.js.map