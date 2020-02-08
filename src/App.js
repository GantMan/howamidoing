import React, {useEffect} from 'react';
import './App.css';
import * as faceapi from 'face-api.js';
import {VictoryPie, VictoryTooltip} from 'victory';

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
    videoRef.current.srcObject = stream
    // hold until the camera loads
    return new Promise((resolve, _) => {
      videoRef.current.onloadedmetadata = () => {
        // right spot?
        detectFaceStuff()
        resolve()
      }
    })
}

const detectFaceStuff = async () => {
  const videoEl = videoRef.current
  const canvas = canvasRef.current  
  const result = await faceapi.detectAllFaces(videoEl).withFaceExpressions()
  if (result) {
    // Check out result
    const minConfidence = 0.05
    const facesTotal = result.length
    // Go turn all faces over minConfidence into strings
    const facialExpressions = result.map(r => {
      if (r.detection.score > minConfidence)
        // potential outcomes: neutral, happy, sad, angry, fearful
        return Object.keys(r.expressions).reduce((a, b) => r.expressions[a] > r.expressions[b] ? a : b);      
    })

    // Update numerical results
    
    // Display visual results
    const dims = faceapi.matchDimensions(canvas, videoEl, true)
    const resizedResult = faceapi.resizeResults(result, dims)
    faceapi.draw.drawDetections(canvas, resizedResult)
    faceapi.draw.drawFaceExpressions(canvas, resizedResult, minConfidence)
  }

  requestAnimationFrame(() => {
    // calm down when hidden!
    if (canvasRef.current) {
      detectFaceStuff()
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
            <h4>Faces Detected: 0</h4>
            <h4>Good: 0</h4>
            <h4>Bad: 0</h4>
            <VictoryPie
              animate={{
                duration: 200
              }}
              style={{ labels: { fontSize: 20, fontWeight: "bold" } }}
              labelRadius={({ innerRadius }) => innerRadius + 50 }
              labelComponent={<VictoryTooltip/>}
              colorScale={["green", "#ff2200", "orange", "red", "pink"]}
              data={[
                { x: "Happy", y: 10, label: "Happy" },
                { x: "Neutral", y: 2 },
                { x: "Sad", y: 2 },
                { x: "Angry", y: 2 },
                { x: "Fearful", y: 5 },
              ]}
            />
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
