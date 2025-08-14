import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ResponseData<T> {
  data: T;
  message: string;
  timestamp: string;
  path: string;
  method: string;
  correlationId?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const correlationId = request.headers['x-correlation-id'] as string;

    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Log successful responses
        this.logger.log(
          `${request.method} ${request.url} - ${response.statusCode} - ${responseTime}ms`,
          { correlationId },
        );

        // Add response time header
        response.setHeader('X-Response-Time', `${responseTime}ms`);

        // Standardize response format
        const standardizedResponse: ResponseData<T> = {
          data,
          message: this.getSuccessMessage(request.method, request.url),
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          ...(correlationId && { correlationId }),
        };

        return standardizedResponse;
      }),
    );
  }

  private getSuccessMessage(method: string, path: string): string {
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
}