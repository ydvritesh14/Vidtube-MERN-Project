import express from "express"
import cors from "cors"   //checks who can talk to backend
import cookieParser from "cookie-parser";
import videoRoutes from "./routes/video.routes.js";

import path from "path";
import { fileURLToPath } from "url";
const app = express()

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials:true
    })
)
// common middleware  -->built-in express middleware
/*Middleware functions can perform the following tasks:
1.Execute any code.
2.Make changes to the request and the response objects.
3.End the request-response cycle.
4.Call the next middleware function in the stack.
*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser())
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// app.use(express.static("public"))
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/v1/videos", videoRoutes);


//import routes

import healthcheckrouter from "./routes/healthcheck.routes.js"

import userRouter from "./routes/user.routes.js"


//routes 
app.use("/api/v1/healthcheck",healthcheckrouter)
app.use("/api/v1/users",userRouter)

// Global error handler - MUST be at the bottom
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"
  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || []
  })
})


export { app }