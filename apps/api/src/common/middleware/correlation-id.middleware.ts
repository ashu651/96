import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Generate correlation ID if not present
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    
    // Set correlation ID in request headers
    req.headers['x-correlation-id'] = correlationId;
    
    // Set correlation ID in response headers
    res.setHeader('X-Correlation-ID', correlationId);
    
    // Add correlation ID to request object for easy access
    (req as any).correlationId = correlationId;
    
    // Log request with correlation ID
    this.logger.log(
      `${req.method} ${req.url} - Correlation ID: ${correlationId}`,
      {
        correlationId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    );
    
    next();
  }
}