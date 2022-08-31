import React, { Component } from 'react';
const axios = require("axios");
 
class App extends Component {
  componentDidMount() {
    // fetch('/api').then(data => console.log(data));
  } 
  render() {
    // let result;
    // fetch('http://localhost:3000').then(data => data.json()).then(data => result = data);
    return (
      <div>
        <h1>Image Metadata Toolkit 3000</h1>
        <MainComponent />
      </div>
    )
   }
}

class MainComponent extends Component {
  constructor(props) {
    super(props);
    this.state ={
        file: null,
        uploaded: false,
        exifData: null
    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
  }
  componentDidUpdate() {
    console.log('component update fired');
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
    objectToSend.newFilename = document.querySelector(`#fname`).value || objectToSend.originalFilename;
    for (const key in this.state.exifData) {
      objectToSend[key] = document.querySelector(`#${key}`).value || document.querySelector(`#${key}`).placeholder;
    }
    console.log(objectToSend);
    axios.post('/modify', objectToSend)
      .then(response => console.log(response))
  }

  render() {
    console.log('rendered.')
    if (this.state.uploaded) {
      return <ImageBox filename={this.state.file.name} exifData={this.state.exifData} updateMetadata={this.updateMetadata}/>
    } else
    return <UploadBox onFormSubmit={this.onFormSubmit} onChange={this.onChange} />
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
    let metadata = [];
    for (const key in this.props.exifData) {
      metadata.push(
        <div key={key + 'div'} id="metadata">
          <label>{key}</label>
          <input type="text" key={key} id={key} name={key} placeholder={this.props.exifData[key]}></input>
        </div>);
    }
    return (
      <div id='image'>
        <h4>Image:</h4>
        <img src={'files/' + this.props.filename}></img><br />
        <label>File name:</label>
        <input type="text" key={this.props.filename} id="fname" name="fname" placeholder={this.props.filename}></input>
        {metadata}
        <button type="submit" onClick={this.props.updateMetadata}>Update</button>
      </div>
    )
  }
}

export default App;