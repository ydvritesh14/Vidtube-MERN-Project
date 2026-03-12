import { Router } from "express";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// get all videos
router
  .route("/")
  .get(getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    uploadVideo
  );

// get single video
router.route("/:id").get(getVideoById);

export default router;
