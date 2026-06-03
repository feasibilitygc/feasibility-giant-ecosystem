export enum RequestErrorCodes {
    REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
    INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
    UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
    REQUEST_CREATION_FAILED = 'REQUEST_CREATION_FAILED',
    FETCH_ERROR = 'FETCH_ERROR',
    INVALID_PARAMETERS = 'INVALID_PARAMETERS',
    DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    UNAUTHORIZED_REQUEST = 'UNAUTHORIZED_REQUEST',
    INVALID_REQUEST_TYPE = 'INVALID_REQUEST_TYPE',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    INSUFFICIENT_SAVINGS_HISTORY = 'INSUFFICIENT_SAVINGS_HISTORY',
    ACTIVE_LOAN_EXISTS = 'ACTIVE_LOAN_EXISTS',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    INVALID_SHARE_WITHDRAWAL = 'INVALID_SHARE_WITHDRAWAL',
    BIODATA_NOT_APPROVED = 'BIODATA_NOT_APPROVED',
}

export class RequestError extends Error {
    public readonly errorCode: RequestErrorCodes;
    public readonly statusCode: number;
    public readonly context?: any;

    constructor(errorCode: RequestErrorCodes, message: string, statusCode: number = 400, context?: any) {
        super(message);
        this.name = 'RequestError';
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.context = context;

        // Set the prototype explicitly
        Object.setPrototypeOf(this, RequestError.prototype);
    }
}