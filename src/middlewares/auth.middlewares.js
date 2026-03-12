// import { JsonWebTokenError } from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async (req, _, next) =>
{ 
    // Extract token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();
    // Assuming the token is sent in the Authorization header as a Bearer token
    // If the token is not found in cookies, check the Authorization header
    if(!token ||token === "undefined" || token==="null") {
        throw new ApiError(401, "Unauthorized: No token provided");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Find the user by ID from the decoded token
        const user = await User.findById(decodedToken?._id);
        
        if (!user) {
            throw new ApiError(401, "Unauthorized: User not found");
        }

        req.user = user; // Attach user to request object

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token");
    }


})