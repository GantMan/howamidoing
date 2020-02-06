import React, {useEffect} from 'react';
import './App.css';
import * as faceapi from 'face-api.js';

const videoRef = React.createRef()
const canvasRef = React.createRef()


const loadModelsAndAll = async () => {
    // Load all needed models
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/')
    await faceapi.loadFaceLandmarkModel('/')
    await faceapi.loadFaceExpressionModel('/')
    // get webcam running
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user'
      }
    })
    // window.stream = stream
    videoRef.current.srcObject = stream
    // hold until the camera loads
    return new Promise((resolve, _) => {
      videoRef.current.onloadedmetadata = () => {
        resolve()
      }
    })
}

function App() {

  useEffect(() => {
    // loadModelsAndAll()
  }, []);  

  return (
    <div className="App">
      <header className="App-header">
        <div id="mainContainer">
          <div id="captureContainer">
            <video ref={videoRef} id="inputVideo" className="captureBox" autoPlay muted playsInline></video>
            <canvas id="overlay" ref={canvasRef} className="captureBox" />
          </div>
          <div id="resultsContainer">
            <h2>Faces Detected: 0</h2>
            <h2>Good: 0</h2>
            <h2>Bad: 0</h2>
          </div>
        </div>
        <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>        
      </header>
    </div>
  );
}

export default App;
