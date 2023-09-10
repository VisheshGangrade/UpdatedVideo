const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const fs = require("fs");

// Video Upload
const videoStorage = multer.diskStorage({
  destination: "videos", // Destination to store video
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 10000000, // 10000000 Bytes = 10 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(mp4|MPEG-4)$/)) {
      // upload only mp4 and mkv format
      return cb(new Error("Please upload a Video"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/uploadVideo",
  videoUpload.single("video"),
  (req, res) => {
    res.send(req.file);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.get(
  "/getVideos",
  (req, res) => {
    const directoryPath = path.join(__dirname, "../../", "videos");
    const fileList = fs.readdirSync(directoryPath).map((item, i) => {
      return { fileName: item, index: ++i };
    });
    res.send(fileList);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.get("/video/:id", (req, res) => {
  const fName = req.params.id
  const videoPath = path.join(
    __dirname,
    "../../",
    "videos",
    fName
  );

  const videoStat = fs.statSync(videoPath);

  const fileSize = videoStat.size;

  const videoRange = req.headers.range;

  if (videoRange) {
    const parts = videoRange.replace(/bytes=/, "").split("-");

    const start = parseInt(parts[0], 10);

    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunksize = end - start + 1;

    const file = fs.createReadStream(videoPath, { start, end });

    const header = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,

      "Accept-Ranges": "bytes",

      "Content-Length": chunksize,

      "Content-Type": "video/mp4",
    };

    res.writeHead(206, header);

    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,

      "Content-Type": "video/mp4",
    };

    res.writeHead(200, head);

    fs.createReadStream(videoPath).pipe(res);
  }
});
module.exports = router;
