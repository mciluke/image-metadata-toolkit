const express = require('express');
const path = require('path');
const multer = require('multer');
const piexif = require('piexifjs');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { response } = require('express');

const app = express();
const port = 3000;


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

const getBase64DataFromJpegFile = filename => fs.readFileSync(filename).toString('binary');
const getExifFromJpegFile = filename => piexif.load(getBase64DataFromJpegFile(filename));


//DATABASE
const mongoURI = 'mongodb://localhost/imagemetadata'
mongoose.connect(mongoURI).then(() => console.log('connected to db'));
const Schema = mongoose.Schema;

const filesSchema = new Schema({
  uid: { type: Number, required: true, unique: true },
  files: { type: Array }
});

const databaseModel = mongoose.model('files', filesSchema);

//middleware
const readExifData = (req, res, next) => {
  
  exifData = getExifFromJpegFile(path.join(__dirname, '../uploads/', req.file.filename))
  // console.log(exifData);
  const make = exifData['0th'][piexif.ImageIFD.Make];
  const model = exifData['0th'][piexif.ImageIFD.Model];
  const osVersion = exifData['0th'][piexif.ImageIFD.Software];

  const dateTime = exifData['0th'][piexif.ImageIFD.DateTime];
  const dateTimeOriginal = exifData['Exif'][piexif.ExifIFD.DateTimeOriginal];
  const subSecTimeOriginal = exifData['Exif'][piexif.ExifIFD.SubSecTimeOriginal];

  const latitude = exifData['GPS'][piexif.GPSIFD.GPSLatitude];
  const latitudeRef = exifData['GPS'][piexif.GPSIFD.GPSLatitudeRef];
  const longitude = exifData['GPS'][piexif.GPSIFD.GPSLongitude];
  const longitudeRef = exifData['GPS'][piexif.GPSIFD.GPSLongitudeRef];

  const latitudeMultiplier = latitudeRef == 'N' ? 1 : -1;
  const decimalLatitude = latitudeMultiplier * piexif.GPSHelper.dmsRationalToDeg(latitude);
  const longitudeMultiplier = longitudeRef == 'E' ? 1 : -1;
  const decimalLongitude = longitudeMultiplier * piexif.GPSHelper.dmsRationalToDeg(longitude);
  console.log(make, model, osVersion, dateTime, dateTimeOriginal, subSecTimeOriginal, decimalLatitude, decimalLongitude);
  res.locals.exifData = {make, model, osVersion, dateTime, dateTimeOriginal, subSecTimeOriginal, decimalLatitude, decimalLongitude};
  // console.log(`https://www.google.com/maps?q=${decimalLatitude},${decimalLongitude}`)
  // console.log('model', exifData['0th'][piexif.ImageIFD.Model]);
  next();
}

const modifyExifData = (req, res, next) => {
  const { make, model, osVersion, dateTime, dateTimeOriginal, subSecTimeOriginal, decimalLatitude, decimalLongitude } = req.body;
  const photoExif = getExifFromJpegFile(path.join(__dirname, '../uploads/', req.body.originalFilename))
  console.log('about to modify', path.join(__dirname, '../uploads/', req.body.originalFilename));
  const newExif = JSON.parse(JSON.stringify(photoExif))
  const newImageData = getBase64DataFromJpegFile(path.join(__dirname, '../uploads/', req.body.originalFilename));
  // console.log(newExif);
  newExif['GPS'][piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(decimalLatitude);
  newExif['GPS'][piexif.GPSIFD.GPSLatitudeRef] = 'N';
  newExif['GPS'][piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(decimalLongitude);
  newExif['GPS'][piexif.GPSIFD.GPSLongitudeRef] = 'W';

  newExif['0th'][piexif.ImageIFD.Make] = make;
  newExif['0th'][piexif.ImageIFD.Model] = model;
  newExif['0th'][piexif.ImageIFD.Software] = osVersion;

  newExif['0th'][piexif.ImageIFD.DateTime] = dateTime;
  newExif['Exif'][piexif.ExifIFD.DateTimeOriginal] = dateTimeOriginal;
  newExif['Exif'][piexif.ExifIFD.SubSecTimeOriginal] = subSecTimeOriginal;

  const newExifBinary = piexif.dump(newExif);

  const newPhotoData = piexif.insert(newExifBinary, newImageData);

  let fileBuffer = Buffer.from(newPhotoData, 'binary');
  fs.writeFileSync(path.join(__dirname, '../uploads/', req.body.newFilename), fileBuffer);
  res.locals.newFile = path.join(__dirname, '../uploads/', req.body.newFilename);
  next();
}

const serveImage = (req, res, next) => {
  res.locals.image = path.join(__dirname, '../uploads/', req.params.filename);
  next();
}

const linkUploadToUser = (req, res, next) => {
  // req.file.filename
  uid = req.cookies.uid;
  databaseModel.findOne({ uid }).then(response => {
    console.log(response);
    if (response) {
      //the db already exists, we need to update it
      let newFiles = [...response.files, req.file.filename];
      databaseModel.findOneAndUpdate({ uid }, {files: newFiles}, {new:true}).then(resp => {
        console.log(resp)
        next();
      })
    }
    else {
      //we need to create it
        databaseModel.create({uid, files: [req.file.filename]})
          .then(response => {
            console.log(response);
            next();
          })
    }
  });
}

const checkCookie = (req, res, next) => {
  if (!('uid' in req.cookies)) res.cookie('uid', Math.floor(Math.random() * 100000000));
  else {
    console.log('check mongo for this uid!', req.cookies.uid);
  }
  next();
}

const getFiles = (req, res, next) => {
  uid = req.cookies.uid;
  databaseModel.findOne({ uid }).then(response => {
    if (response) res.locals.files = response.files;
    next();
  })
}

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

//routes
app.use('/files', express.static(path.join(__dirname, '../uploads')));

app.post('/upload', upload.single('myImage'), readExifData, linkUploadToUser, (req, res) => {
  // console.log('image ', req.file)
  res.json(res.locals.exifData)
});

app.post('/modify', modifyExifData, (req, res) => {
  // res.download(res.locals.newFile);
  res.json({filename:req.body.newFilename});
})

app.get('/processed/:filename', serveImage, (req, res) => {
  console.log(res.locals.image)
  res.download(res.locals.image);
})

app.get('/checkForUserFiles', checkCookie, getFiles, (req, res) => {

  res.json(res.locals.files)
})

app.listen(port, () => console.log(`Listening on port ${port}`));