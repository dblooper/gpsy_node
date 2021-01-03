import { ApiData } from "./ApiData";

export class ApiError implements ApiData {
    errorCode: Number
    message: String

    constructor(errorCode: Number, message: String) {
        this.errorCode = errorCode;
        this.message = message;
    }

}