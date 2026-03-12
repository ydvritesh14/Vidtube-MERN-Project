// It acts as a function that defines the response sent to a client when making a request to the server.
import {ApiResponse} from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200,"OK","healthcheck passed"))
})

export{healthcheck}