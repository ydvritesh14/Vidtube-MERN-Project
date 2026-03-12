import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: false,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            required:true
        },
        conerImage: {
            type:String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password: {
            type: String,
            reqired:[true,"password is required"]
        },
        refreshToken: {
            type: String
        }

    },
    {timestamps:true}
)

//Encrypt password just before saving in DataBase
userSchema.pre("save", async function (next) {
    
    if (!this.isModified("password")) return next() //not modified ->move next//skip hashing
    
    this.password = await bcrypt.hash(this.password, 10) 
    
    next()
})

//Decrypt & match password
userSchema.methods.isPasswordCorrect=async function (password) {
    return await bcrypt.compare(password,this.password);
    //compare the password with the hashed password
}

//GenerateAccesToken
userSchema.methods.generateAccessToken = function () {
    //short lived access token
    //jwt  sign method takes payload, secret key and options ,generates a token
    jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname:this.fullname
    },
        process.env.ACCESS_TOKEN_SECRET,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
        
        
    )
}
userSchema.methods.generateRefreshToken = function () {
    //short lived access token
    jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
    {expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
        
        
    )
}

export const User = mongoose.model("User", userSchema) 
