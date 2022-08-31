const express = require('express');
const path = require('path');
const multer = require('multer');
const piexif = require('piexifjs');
const fs = require('fs');

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
  next();
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//routes
app.use('/files', express.static(path.join(__dirname, '../uploads')));

app.post('/upload', upload.single('myImage'), readExifData, (req, res) => {
  // console.log('image ', req.file)
  res.json(res.locals.exifData)
});

app.post('/modify', modifyExifData, (req, res) => {
  res.json({});
})

app.listen(port, () => console.log(`Listening on port ${port}`));