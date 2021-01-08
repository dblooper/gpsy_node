import { ApiData } from "./ApiData";
import { ApiError } from "./ApiError";

export class ApiResponse {
    public static STATUSES = {
        ERROR: 1,
        OK: 0
    }
    
    status: Number;
    info: ApiData;

    constructor(message: ApiData) {
        if(message instanceof ApiError) {
            this.status = ApiResponse.STATUSES.ERROR;
        } else {
            this.status = ApiResponse.STATUSES.OK;
        }
        this.info = message;
    }
}