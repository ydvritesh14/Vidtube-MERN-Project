import dotenv from "dotenv"
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path:"./.env"
})

// const port = 7000;

const port=process.env.PORT || 7000 


connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port} `);
    })
})
.catch((err) => {
    console.log("MongoDb connection error",err);
    
})

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
 