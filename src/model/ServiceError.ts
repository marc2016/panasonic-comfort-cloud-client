export class ServiceError extends Error {

    private _code: number
    private _httpCode: number

    constructor(message: string, code: number, httpCode: number) {
        super(message)
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'ServiceError'
        this._code = code
        this._httpCode = httpCode
    }

    get code(): number {
        return this._code
    }

    get httpCode(): number {
        return this._httpCode
    }
}