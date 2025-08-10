import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(exceptionResponse),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception.stack,
        details: exceptionResponse,
      }),
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${this.getErrorMessage(exceptionResponse)}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object') {
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message.join(', ');
      }
      return exceptionResponse.message || 'Internal server error';
    }

    return 'Internal server error';
  }
}