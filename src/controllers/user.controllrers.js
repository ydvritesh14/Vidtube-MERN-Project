import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId); // find user by id

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; // save refresh token in user document
    await user.save({ validateBeforeSave: false }); // save user without validating password again
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access & refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // how to register the user ->accept data from user
  const { fullname, username, email, password } = req.body;

  //validataion
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const userExisted = await User.findOne({
    $or: [{ username }, { email }],
  });
  //To check user doesn't exist
  if (userExisted) {
    throw new ApiError(409, "User with email Or username already existed");
  }

  //To handle the images that comes in file -->given by multer
  console.warn(req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    //if it not    present in DB
    throw new ApiError(400, "Avatar file is missing");
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath)
  // let coverImage = ""

  // if (coverLocalPath) {
  //     coverImage = await uploadOnCloudinary(coverImage)
  // }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("avatar uploaded ", avatar);
  } catch (error) {
    console.log("Error uploading avatar", avatar);
    throw new ApiError(500, "Avatar file is missing");
  }
  let coverImage=null;
  if (coverLocalPath) {
    try {
      coverImage = await uploadOnCloudinary(coverLocalPath);
      console.log("coverImage uploaded ", coverImage);
    } catch (error) {
      console.log("Error uploading coverImage", coverImage);
      throw new ApiError(500, "Failed to uplload coverImage");
    }
  }
  //
  try {
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    //if not user created,throw error
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.log("User creation failed");

    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(
      500,
      "Something went wrong while registering a user & images were deleted"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  //get data from body
  const { email, password, username } = req.body;

  //validation
    if ([email, password, username].some((field) => field?.trim() === ""))
    {
        console.log(typeof email, typeof password, typeof username); 
    // check if any field is empty //trim() removes whitespace
        throw new ApiError(400, "All fields are required");
    }

  //check if user exists
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  //if user doesn't exist
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //validate password
  const isPasswordvalid = await user.isPasswordCorrect(password );

  //if password is not correct
    if (!isPasswordvalid) {
    
      throw new ApiError(401, "Invalid user credentials");  
    }

  //generate access & refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  ); // generate tokens using user id

  //send response
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // find user by id and exclude password and refreshToken from response

  const options = {
    httpOnly: true, // not accessible by JS ,prevents client-side scripts from accessing the cookie
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // cookie expires in 7 days
    secure: process.env.NODE_ENV === "production", // only sent over HTTPS in production
  };
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options) // set refresh token in cookie
    .cookie("accessToken", accessToken, options) // set access token in cookie
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken }, // send user data and tokens in response
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    // find user by id from request object
    // req.user is set by verifyJWT middleware
    // update user document to clear refresh token

    req.user._id,
    {
      $set: {
        refreshToken: undefined,
        // clear refresh token from user document
      },
    },
    { new: true } // return the updated user document
  );

  // clear cookies
  // set options for cookies
  // clear cookies by setting them to empty values and setting httpOnly and secure options
  // httpOnly prevents client-side scripts from accessing the cookie
  const options = {
    httpOnly: true, // not accessible by JS
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Function to refresh access token
// This function will be called when the user wants to refresh their access token using the refresh token
const refresAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; // get refresh token from cookies or body
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
      // verify the refresh token using secret key
    );
    // Check if user exists
    // find user by id from decoded token
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    // Check if refresh token matches the one stored in user database
    // if refresh token from request does not match the one stored in user document, throw error
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // options for cookies
    // Set new access token in cookies
    const options = {
      httpOnly: true, // not accessible by JS
      secure: process.env.NODE_ENV === "production", // only sent over HTTPS in production
    };

    // Generate new access token
    const { accessToken, refresAcessToken: newRefreshTokken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accesstoken", accessToken, options)
      .cookie("refreshtoken", newRefreshTokken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshTokken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {}
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword; // update password
  await user.save({ validateBeforeSave: false }); // save user with password validation

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user,
        "Current user details fetched successfully"
      )
    );
});
const updateCurrentDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  //validation
  if (!fullname || !email) {
    throw new ApiError(400, "Fullname and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true } // return updated user and validate fields
  ).select("-password -refreshToken"); // exclude password and refreshToken from response

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.secure_url) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.secure_url,
      },
    },
    { new: true } // return updated user and validate fields
  ).select("-password -refreshToken"); // exclude password and refreshToken from response

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.secure_url) {
    throw new ApiError(500, "Failed to upload cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.secure_url,
      },
    },
    { new: true } // return updated user and validate fields
  ).select("-password -refreshToken"); // exclude password and refreshToken from response

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image updated successfully"));
});

const userChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions", // collection name in MongoDB
                localField: "_id", // field in User collection
                foreignField: "channel", // field in Subscription collection
                as: "subscribers", // alias for the joined data
            },
        },
        {
            $lookup: {
                from: "subscriptions", // collection name in MongoDB
                localField: "_id", // field in User collection
                foreignField: "subscriber", // field in Subscription collection
                as: "subscribedTo", // alias for the joined data
            },
        },
        {
            $addFields: {
                subscribersCount: {
                // count of subscribers
                $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                // count of channels subscribed to
                $size: "$subscribedTo",
                    },
                
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"],
                            //  check if user id is in subscribers list
                        },
                        then: true,
                        else: false,
                    }
                        
                    
                }
            },
        },
        {
          //project only the necessary fields
          $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
              coverImage: 1,
              subscribersCount: 1,
              channelsSubscribedToCount: 1,
              isSubscribed: 1,
              email: 1, // include email if needed
            },
        }
  ]);
    
    // if channel not found 
    if(!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        { 
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id) // match user by id
            }
        },
        {
            $lookup: {
                from: "videos", // collection name in MongoDB
                localField: "watchHistory", // field in User collection
                foreignField: "_id", // field in Video collection
                as: "watchHistoryVideos", // alias for the joined data
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // collection name in MongoDB
                            localField: "owner", // field in Video collection
                            foreignField: "_id", // field in User collection
                            as: "owner", // alias for the joined data
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $arrayElemAt: ["$owner", 0] // get the first element of the owner array 
                            }
                        }
                    }
                ]
                
            },
        },
        
    ])

    return res.status(200).json(
        new ApiResponse(200, user[0]?.watchHistoryVideos || [], "Watch history fetched successfully")
    );
})

export {
  registerUser,
  loginUser,
  refresAccessToken,
  logoutUser,
  changePassword,
  getCurrentUser,
  updateCurrentDetails,
  updateUserAvatar,
  updateUserCoverImage,
  userChannelProfile,
  getWatchHistory,
};
