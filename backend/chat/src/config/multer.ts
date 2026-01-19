import multer from "multer";
import path from "path";

const storage: multer.StorageEngine = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, path.resolve("public/temp"));
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload: multer.Multer = multer({
  storage,
});

export default upload;
