import { ApiData } from "./ApiData";
import { ApiError } from "./ApiError";

export class ApiResponse {
    public static STATUSES = {
        ERROR: 1,
        OK: 0
    }
    
    status: Number;
    message: ApiData;

    constructor(message: ApiData) {
        if(message instanceof ApiError) {
            this.status = ApiResponse.STATUSES.ERROR;
        } else {
            this.status = ApiResponse.STATUSES.OK;
        }
        this.message = message;
    }
}