const multer = require("multer");

// Memory storage for high-speed file processing and buffer access
const storage = multer.memoryStorage();

// Allowed file types
const ALLOWED_DOCUMENT_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/tiff",
];

const fileFilter = (req, file, cb) => {
  const isMimeAllowed = ALLOWED_DOCUMENT_MIMES.includes(file.mimetype);
  const isExtAllowed = file.originalname.match(
    /\.(jpg|jpeg|png|webp|tiff|pdf|doc|docx|xls|xlsx|csv|txt)$/i
  );

  if (isMimeAllowed || isExtAllowed) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type. Please upload a valid PDF, Word (DOC/DOCX), Excel (XLS/XLSX), CSV, TXT, or Image (JPG/PNG/WEBP) file."
      )
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max file size
    files: 10, // Max 10 files per request
  },
  fileFilter,
});

// Helper shortcuts
upload.singleDocument = upload.single("file");
upload.multipleDocuments = upload.array("files", 10);
upload.documentOrImage = upload.single("document");

module.exports = upload;
