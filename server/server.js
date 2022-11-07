const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const exifController = require('./controllers/exifController');
const fileController = require('./controllers/fileController');
const userController = require('./controllers/userController');

const app = express();
const port = 3000;


const storage = multer.diskStorage({
  destination(request, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename(request, file, cb) {
    // console.log(file.originalname)
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });
// console.log('dir', path.join(__dirname, '../../uploads'))

// middleware

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// routes
// route'/' serve index.html that npm run build output
// app.use('/', (req, res) => res.sendFile(path.resolve(__dirname, '../build/index.html')));

app.use('/files', express.static(path.join(__dirname, '../uploads')));

app.post(
  '/upload',
  upload.single('myImage'),
  exifController.readExifData,
  userController.linkUploadToUser,
  (req, res) => res.json(res.locals.exifData),
);

app.post('/modify', exifController.modifyExifData, (req, res) => {
  // res.download(res.locals.newFile);
  res.json({ filename: req.body.newFilename });
});

app.get('/processed/:filename', fileController.serveImage, (req, res) => {
  console.log(res.locals.image);
  res.download(res.locals.image);
});

app.get('/checkForUserFiles', userController.checkCookie, fileController.getFiles, (req, res) => {
  res.json(res.locals.files);
});

app.get('/delete/:file', fileController.deleteFile, (req, res) => {
  res.json(res.locals.newFileList);
});

app.use('/', express.static(path.join(__dirname, '../build')));

app.listen(port, () => console.log(`Listening on port ${port}`));
