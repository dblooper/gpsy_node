import { ApiData } from "./ApiData";

export class ApiError implements ApiData {
    errorCode: Number
    message: any[];

    constructor(errorCode: Number, message: any) {
        this.errorCode = errorCode;
        if(!(message instanceof Array)) {
            message = [message];
        }
        this.message = message;
    }

}