const userController = {};

userController.checkCookie = (req, res, next) => {
    if (!('uid' in req.cookies)) res.cookie('uid', Math.floor(Math.random() * 100000000));
    else {
      console.log('check mongo for this uid!', req.cookies.uid);
    }
    next();
  }

  
  userController.linkUploadToUser = (req, res, next) => {
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

  module.exports = userController;