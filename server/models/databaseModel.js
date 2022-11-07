const mongoose = require('mongoose');
const { Schema } = mongoose;

const mongoURI = 'mongodb://localhost/imagemetadata';
mongoose.connect(mongoURI).then(() => console.log('connected to db'));

const filesSchema = new Schema({
  uid: { type: Number, required: true, unique: true },
  files: { type: Array },
});

module.exports = mongoose.model('files', filesSchema);
