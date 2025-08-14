import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface ResponseData<T> {
    data: T;
    message: string;
    timestamp: string;
    path: string;
    method: string;
    correlationId?: string;
}
export declare class ResponseInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
    private readonly logger;
    intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>>;
    private getSuccessMessage;
}
