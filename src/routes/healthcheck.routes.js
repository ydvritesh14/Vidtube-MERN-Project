import { Router } from "express";

import { healthcheck } from "../controllers/healthcheckControllers.js";

const router = Router()

router.route("/").get(healthcheck) //home path

export default router