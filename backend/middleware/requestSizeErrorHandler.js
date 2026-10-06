import multer from "multer";

export default function requestSizeErrorHandler(error, req, res, next) {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body exceeds the 10 KB limit" });
  }

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Profile image exceeds the 5 MB limit" });
  }

  return next(error);
}