const piexif = require('piexifjs');
const fs = require('fs');
const path = require('path');

const exifController = {};

exifController.getBase64DataFromJpegFile = filename => fs.readFileSync(filename).toString('binary');
exifController.getExifFromJpegFile = filename => piexif.load(exifController.getBase64DataFromJpegFile(filename));


exifController.readExifData = (req, res, next) => {
    exifData = exifController.getExifFromJpegFile(path.join(__dirname, '../../uploads/', req.file.filename))
    console.log(exifData);
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
  
    try {
      const latitudeMultiplier = latitudeRef == 'N' ? 1 : -1;
      const decimalLatitude = latitudeMultiplier * piexif.GPSHelper.dmsRationalToDeg(latitude);
      const longitudeMultiplier = longitudeRef == 'E' ? 1 : -1;
      const decimalLongitude = longitudeMultiplier * piexif.GPSHelper.dmsRationalToDeg(longitude);
      res.locals.exifData = {make, model, osVersion, dateTime, dateTimeOriginal, subSecTimeOriginal, decimalLatitude, decimalLongitude};
    } catch (err) {
      const latitudeMultiplier = null
      const decimalLatitude = null
      const longitudeMultiplier = null
      const decimalLongitude = null
      res.locals.exifData = {make, model, osVersion, dateTime, dateTimeOriginal, subSecTimeOriginal, decimalLatitude, decimalLongitude};
    }

    // console.log(`https://www.google.com/maps?q=${decimalLatitude},${decimalLongitude}`)
    // console.log('model', exifData['0th'][piexif.ImageIFD.Model]);
    next();
  }

  exifController.modifyExifData = (req, res, next) => {
    const { make, model, osVersion, dateTime, dateTimeOriginal, subSecTimeOriginal, decimalLatitude, decimalLongitude } = req.body;
    const photoExif = exifController.getExifFromJpegFile(path.join(__dirname, '../uploads/', req.body.originalFilename))
    // console.log('about to modify', path.join(__dirname, '../uploads/', req.body.originalFilename));
    const newExif = JSON.parse(JSON.stringify(photoExif))
    const newImageData = exifController.getBase64DataFromJpegFile(path.join(__dirname, '../uploads/', req.body.originalFilename));
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

  module.exports = exifController;