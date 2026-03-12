import { Router } from "express";

import {
  registerUser,
  logoutUser,
  loginUser,
  refresAccessToken,
  changePassword,
  getCurrentUser,
  userChannelProfile,
  updateCurrentDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory
} from "../controllers/user.controllrers.js";

//Needed upload from user
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

//Unsecured routes
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser)
router.route("/refresh-token").post(refresAccessToken)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/c/:username").get(verifyJWT, userChannelProfile);
router.route("/update-account").patch(verifyJWT, updateCurrentDetails);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/watch-history").get(verifyJWT, getWatchHistory);



export default router;
