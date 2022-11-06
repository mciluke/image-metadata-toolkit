const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost/imagemetadata';
mongoose.connect(mongoURI).then(() => console.log('connected to db'));
const { Schema } = mongoose;

const filesSchema = new Schema({
  uid: { type: Number, required: true, unique: true },
  files: { type: Array },
});

const databaseModel = mongoose.model('files', filesSchema);
