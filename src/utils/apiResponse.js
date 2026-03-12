//Api response & error response are always in class format

class ApiResponse {
    constructor (statuscode, data, message = "message") {
        this.statuscode = statuscode;
        this.data = data;
        this.message = message;
        this.success = statuscode < 400;
    }
}

export {ApiResponse}