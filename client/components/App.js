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
      <div>
        <h1 id='test' onClick={() => this.setState({title: this.state.title == 'Image Metadata Toolkit 3000' ? 'Image Metadata Toolkit' : 'Image Metadata Toolkit 3000'})}>{this.state.title}</h1>
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
            <img onClick={() => console.log('clicked')}src={'/files/' + el}></img>
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
        this.setState({modified: true, filename: response.data.filename, files: [...this.state.files, response.data.filename]})
      })
  }

  render() {
    console.log('rendered.')
    if (this.state.uploaded && !this.state.modified) {
      //if the user uploaded and has not yet sent changes, show the image and text fields
      return <ImageBox filename={this.state.file.name} exifData={this.state.exifData} newFilename={this.state.filename} updateMetadata={this.updateMetadata}/>
    } else {
    //if the user 
    // this.setState({modified:false, uploaded:false});
    return (
      <div id="appy">
        <UploadBox onFormSubmit={this.onFormSubmit} onChange={this.onChange} />
        <FilesBox files={this.state.files} />
      </div>
    )
    }
  }
}

class UploadBox extends Component {
  render() {
    return (
      <form onSubmit={this.props.onFormSubmit}>
        <h3>Upload an image (*.jpg)</h3>
        <input type="file" name="myImage" onChange={this.props.onChange} />
        <button type="submit">Upload</button>
      </form>
    )
  }
}

class ImageBox extends Component {
  render() {
    console.log('render image box', this.props.newFilename)
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
    metadata.push(
      <div id="google static map">
        <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${this.props.exifData.decimalLatitude}%2c%20${this.props.exifData.decimalLongitude}&zoom=12&size=400x400&key=AIzaSyCcO8NepIZPmMYPvi7EBkzP0QRwZduPxhA`}></img>
      </div>
    );
    //AIzaSyCcO8NepIZPmMYPvi7EBkzP0QRwZduPxhA api key
    //https://maps.googleapis.com/maps/api/staticmap?center=41.072125%2c%20-72.43842222222223&zoom=12&size=400x400&key=AIzaSyCcO8NepIZPmMYPvi7EBkzP0QRwZduPxhA

    // if (this.props.newFilename) {
    //   metadata = [];
    //   metadata.push(
    //     <div key="download"></div>
    //   )
    // }
    return (
      <div id='image'>
        <h4>Image:</h4>
        <img src={'files/' + this.props.filename}></img><br />
        {metadata}

        <button type="submit" onClick={this.props.updateMetadata}>Update</button>
      </div>
    )
  }
}

export default App;