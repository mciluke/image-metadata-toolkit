import React, { Component } from 'react';
const axios = require("axios");
 
class App extends Component {
  constructor(props) {
    super(props);
    this.state ={
      title: 'Image Metadata Toolkit'
    };
  }
  componentDidMount() {
    // fetch('/api').then(data => console.log(data));
  } 
  render() {
    // let result;
    // fetch('http://localhost:3000').then(data => data.json()).then(data => result = data);
    // let title = 'Image Metadata Toolkit'
    return (
      <div class="jumbotron">
        <h1 class="display-4" id='test' onClick={() => this.setState({title: this.state.title == 'Image Metadata Toolkit 3000' ? 'Image Metadata Toolkit' : 'Image Metadata Toolkit 3000'})}>{this.state.title}</h1>
        <MainComponent />
        {/* <FilesComponent /> */}
      </div>
    )
   }
}
class FilesBox extends Component {
  render() {
    console.log('rendered the files box')
    console.log(this.props.files.length)
    if (this.props.files.length){
      const files = [];
      this.props.files.forEach((el, ind) => {
        files.push(
          <span key={ind} id={'img' + ind}>
            <img onClick={() => this.props.expandImage(el)} src={'/files/' + el}></img>
          </span>
        )
      })
      return (
        <div id="files">
          <hr />
          <h3>My Files:</h3>
          {files}
        </div>
      )
    }
    else return '';
  }
}
class MainComponent extends Component {
  constructor(props) {
    super(props);
    this.state ={
        file: null,
        uploaded: false,
        exifData: null,
        modified: false,
        files: []
    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.expandImage = this.expandImage.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
  }
  componentDidMount() {
    fetch('/checkForUserFiles')
    .then(resp => resp.json())
    .then(data => {
      console.log(data)
      this.setState({files: data})
    });
  }
  componentDidUpdate() {
    console.log('component update fired');
    if (this.state.modified && this.state.uploaded) {
      // console.log('file ready at', `/processed/${this.state.filename}`)
      this.setState({modified:false, uploaded:false, newFilename: ''});
      // axios.get(`/processed/${this.state.filename}`)
    }
  }
  deleteFile(e) {
    console.log('delete', e);
    fetch('/delete/' + e).then(resp => {
      this.setState({uploaded: false, modified: false, view: this.state.view == true ? false : true, file: {name: e}});

    })
  }
  expandImage(e) {
    console.log('clicked img', e)

    this.setState({uploaded: false, modified: false, view: this.state.view == true ? false : true, file: {name: e}});

  }
  onFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('myImage',this.state.file);
    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        }
    };
    axios.post('/upload',formData,config)
        .then((response) => {
            console.log(response);
            this.setState({uploaded:true, exifData: response.data})
            // alert("The file is successfully uploaded");
        }).catch((error) => {
    });
  }
  onChange(e) {
    this.setState({file:e.target.files[0]});
  }
  updateMetadata(e) {
    const objectToSend = {};
    objectToSend.originalFilename = document.querySelector(`#fname`).placeholder;
    objectToSend.newFilename = document.querySelector(`#fname`).value || 'updated_' + objectToSend.originalFilename;
    for (const key in this.state.exifData) {
      objectToSend[key] = document.querySelector(`#${key}`).value || document.querySelector(`#${key}`).placeholder;
    }
    console.log(objectToSend);
    axios.post('/modify', objectToSend)
      .then(response => {
        console.log(response)
        this.setState({modified: true, filename: response.data.filename, files: [...this.state.files, objectToSend.originalFilename]})
      })
  }

  render() {
    console.log('rendered main component.')
    if (this.state.uploaded && !this.state.modified) {
      //if the user uploaded and has not yet sent changes, show the image and text fields
      return <ImageBox filename={this.state.file.name} exifData={this.state.exifData} newFilename={this.state.filename} updateMetadata={this.updateMetadata}/>
    } 
    else if (this.state.view) {
      //just view the image and download links
      return (
      <div class="lead" id="viewer">
        <ImageBox deleteFile={this.deleteFile} expandImage={this.expandImage} filename={this.state.file.name} view={this.state.view}/>
      </div>
      )
    }
    else {
    //if the user 
    // this.setState({modified:false, uploaded:false});
    return (
      <div class="lead" id="appy">
        <UploadBox onFormSubmit={this.onFormSubmit} onChange={this.onChange} />
        <FilesBox expandImage={this.expandImage} files={this.state.files} view={this.state.view}/>
      </div>
    )
    }
  }
}

class UploadBox extends Component {
  render() {
    return (
      <div class="">
        <form onSubmit={this.props.onFormSubmit}>
          <h3>Upload an image (*.jpg)</h3>
          <input class="form-control form-control-sm" type="file" name="myImage" onChange={this.props.onChange} />
          <button type="submit" class="uploader form-control form-control-sm btn btn-primary">Upload</button>
        </form>
      </div>
    )
  }
}

class ImageBox extends Component {
  render() {
    console.log('hi')
    // console.log(this.props)
    if (this.props.view) {
      console.log('render image box for viewing!', this.props.filename);
      return (
        <div class="row" id='image'>
          <h4>Image:</h4>
          <div class="column"><img onClick={this.props.expandImage} src={'/files/updated_' + this.props.filename}></img><br /></div>
          <div class="column"><a target="_blank" href={'/files/updated_' + this.props.filename}>Download Modified</a><br />
          <a target="_blank" href={'/files/' + this.props.filename}>Download Original</a><br />
          <button type="submit" onClick={() => {
            this.props.deleteFile(this.props.filename);
            this.props.expandImage();
          }}>Delete File</button></div>
        </div>
      )
    } else {
    //upload
    console.log('render image box for upload!', this.props.newFilename)
    let metadata = [];
    metadata.push(
      <div key={'fname'} id="metadata">
        <label>File name:</label>
        <input type="text" key={this.props.filename} id="fname" name="fname" placeholder={this.props.filename}></input>
      </div>
    )
    for (const key in this.props.exifData) {
      metadata.push(
        <div key={key + 'div'} id="metadata">
          <label>{key}</label>
          <input type="text" key={key} id={key} name={key} placeholder={this.props.exifData[key]}></input>
        </div>);
    }
    console.log('metadata:', metadata.length)
    metadata.push(
      <div id="google static map">
        <button type="submit" onClick={() => document.querySelector("#map").src = `https://maps.googleapis.com/maps/api/staticmap?center=${document.querySelector("#decimalLatitude").value}%2c%20${document.querySelector("#decimalLongitude").value}&zoom=12&size=300x250&key=`}>Refresh Map</button><br />
        <img id="map" src={`https://maps.googleapis.com/maps/api/staticmap?center=${this.props.exifData.decimalLatitude}%2c%20${this.props.exifData.decimalLongitude}&zoom=12&size=300x250&key=`}></img>
      </div>
      
    );
    return (
      <div class="row" id='image'>
        <h4>Image:</h4>
        <div class="column"><img src={'files/' + this.props.filename}></img></div>
        <div class="column">{metadata}

        <button type="submit" onClick={this.props.updateMetadata}>Update</button></div>
      </div>
    )
  }
  }
}

export default App;