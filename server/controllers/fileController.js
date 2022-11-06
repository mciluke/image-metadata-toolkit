const path = require('path');
const multer = require('multer');
// const databaseModel = require('./controllers/userController');

const fileController = {};

fileController.serveImage = (req, res, next) => {
  res.locals.image = path.join(__dirname, '../uploads/', req.params.filename);
  return next();
};

fileController.getFiles = (req, res, next) => {
  uid = req.cookies.uid;
  databaseModel.findOne({ uid }).then((response) => {
    if (response) res.locals.files = response.files;
    return next();
  });
};

fileController.deleteFile = (req, res, next) => {
  // req.params.file

  databaseModel.findOne({ uid: req.cookies.uid }).then((resp) => {
    const newFilesList = resp.files.filter((el) => el !== req.params.file);
    //   console.log('about to delete a file', req.params.file);
    //   console.log('deleteing from', response);
    databaseModel.findOneAndUpdate({ uid: req.cookies.uid }, { files: newFilesList }, { new: true })
      .then((resp) => {
        //   console.log('deleted! now it looks like:', resp)
        res.locals.newFileList = resp;
        return next();
      });
  });
};

fileController.uploadFile = (req, res, next) => {
  const storage = multer.diskStorage({
    destination(request, file, cb) {
      cb(null, './uploads');
    },
    filename(request, file, cb) {
      cb(null, file.originalname);
    },
  });
  const upload = multer({ storage });
  upload.single('myImage');
  return next();
};

module.exports = fileController;
