import { ApiData } from "./ApiData";

export class ApiError implements ApiData {
    errorCode: Number
    message: any;

    constructor(errorCode: Number, message: any) {
        this.errorCode = errorCode;
        this.message = message;
    }

}