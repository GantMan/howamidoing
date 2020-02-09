import React, {useEffect, useState} from 'react';
import './App.css';
import * as faceapi from 'face-api.js';
import {VictoryPie, VictoryTooltip} from 'victory';


const videoRef = React.createRef()
const canvasRef = React.createRef()

const getFaceStats = (emotions) => {
  // const fCount = emotions.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {})
  const fCount = emotions.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {
    neutral: 0, happy: 0, sad: 0, fearful: 0, angry: 0, disgusted: 0, surprised: 0
  })

  const chart = [
    { x: "Happy", y: fCount.happy },
    { x: "Neutral", y: fCount.neutral },
    { x: "Surprised", y: fCount.surprised },
    { x: "Sad", y: fCount.sad },
    { x: "Fearful", y: fCount.fearful },
    { x: "Disgusted", y: fCount.disgusted },
    { x: "Angry", y: fCount.angry },    
  ]
  const good = fCount.happy + fCount.neutral + fCount.surprised
  const bad = fCount.sad + fCount.fearful + fCount.angry + fCount.disgusted
  return {chart, good, bad, total: emotions.length}
}

function App() {
  const [totalFaces, setTotalFaces] = useState(0)
  const [faces, setFaces] = useState({})

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
      // Go turn all faces over minConfidence into strings
      const facialExpressions = result.map(r => {
        if (r.detection.score > minConfidence)
          return Object.keys(r.expressions).reduce((a, b) => r.expressions[a] > r.expressions[b] ? a : b);      
      })
  
      // Update numerical results
      const faceStats = getFaceStats(facialExpressions)
      setTotalFaces(result.length)
      setFaces(faceStats)
      
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
            <h4>Faces Above Min Confidence: {faces.total}</h4>
            <h4>Faces Detected: {totalFaces}</h4>
            <h4>Good: {faces.good}</h4>
            <h4>Bad: {faces.bad}</h4>
          </div>
          <div id="resultsContainer">
            <VictoryPie
              animate={{
                duration: 200
              }}
              style={{ labels: { fontSize: 20, fontWeight: "bold" } }}
              labelRadius={({ innerRadius }) => innerRadius + 50 }
              labelComponent={<VictoryTooltip/>}
              colorScale={["#029832", "#62b32b", "#C7EA46", "#fedb00", "#f97a00", "#ff5349", "#d50218"]}
              data={faces.chart}
            />
          </div>
        </div>
        <div>
          
        </div>
        <p>
            Code on <code>GitHub</code>
          </p>
          <a
            className="App-link"
            href="http://gantlaborde.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            By Gant Laborde
          </a>        
      </header>
    </div>
  );
}

export default App;
