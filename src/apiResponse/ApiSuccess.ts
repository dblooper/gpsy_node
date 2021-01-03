import { ApiData } from "./ApiData";

export class ApiSuccess implements ApiData {
    data: any;
    message: String;
    constructor(data: any) {
        if(typeof data === 'string') {
            this.message = data;
        } else {
            this.data = data;
        }
    }
}