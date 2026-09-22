const multer = require('multer');

// Memory storage keeps file buffers in memory for direct HTTP transmission to Python service
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  }
});

module.exports = upload;
