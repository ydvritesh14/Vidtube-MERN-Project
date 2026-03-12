import multer from "multer";

//allow disk storage
// multer will save the files in the public/temp folder
// and the file name will be the original name of the file  
// multer will handle the file uploads and save them in the specified location
// multer will also handle the file size limit and file type validation
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
        //Todo:for users
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({
    storage
})
  