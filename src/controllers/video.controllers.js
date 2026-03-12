import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find().populate("owner", "username");

  return res.status(200).json(new ApiResponse(200, videos, "Videos fetched"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).populate(
    "owner",
    "username"
  );

  return res.status(200).json(new ApiResponse(200, video, "Video fetched"));
});

export const uploadVideo = asyncHandler(async (req, res) => {
  const { title } = req.body;

  if (!title) {
    throw new ApiError(400, "Title is required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  // Upload video to Cloudinary
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "Failed to upload video");
  }

  // Upload thumbnail
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  const video = await Video.create({
    title,
    videoFile:videoFile.secure_url,
    thumbnail:thumbnail.secure_url,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});
