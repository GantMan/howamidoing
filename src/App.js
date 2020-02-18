import React, {useEffect, useState} from 'react';
import './App.css';
import logo from './logo.svg'
import * as faceapi from 'face-api.js';
import {VictoryPie, VictoryTooltip} from 'victory';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

const videoRef = React.createRef()
const canvasRef = React.createRef()
let minConfidence = 0.5
let faceBoundaries = false

const getFaceStats = (emotions) => {
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
  const [faces, setFaces] = useState({})

  const loadModelsAndAll = async () => {
    // Load all needed models
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/')
    await faceapi.loadFaceLandmarkModel('/')
    await faceapi.loadFaceExpressionModel('/')
    // get webcam running
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user'
        }
      })
    } catch (err) {
      alert('Sorry - Your Browser isn\'t allowing access to your webcam.  Try a different browser for this device?')
      console.error('getUserMedia error', err);
    }
    videoRef.current.srcObject = stream
    // hold until the camera loads
    return new Promise((resolve, _) => {
      videoRef.current.onloadedmetadata = () => {
        // Kick off right away
        detectFaceStuff()
        resolve()
      }
    })
  }  

  const detectFaceStuff = async () => {
    const videoEl = videoRef.current
    const canvas = canvasRef.current  
    const result = await faceapi.detectAllFaces(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence })).withFaceExpressions()
    if (result && result.length > 0) {
      // Go turn all faces over minConfidence into strings
      const facialExpressions = result.map(r => {
        if (r.detection.score > minConfidence)
          return Object.keys(r.expressions).reduce((a, b) => r.expressions[a] > r.expressions[b] ? a : b);      
      }) 
  
      // Update numerical results
      const faceStats = getFaceStats(facialExpressions)
      setFaces(faceStats)
      
      // Display visual results
      if (faceBoundaries) {   
        canvas.style.visibility='visible';    
        const dims = faceapi.matchDimensions(canvas, videoEl, true)
        const resizedResult = faceapi.resizeResults(result, dims)
        faceapi.draw.drawDetections(canvas, resizedResult)
        faceapi.draw.drawFaceExpressions(canvas, resizedResult, minConfidence)
      } else {
        canvas.style.visibility='hidden';
      }
    }
  
    console.log(minConfidence)
    requestAnimationFrame(() => {
      // calm down when hidden!
      if (canvasRef.current) {
        detectFaceStuff()
      }
    })
  
  }  

  useEffect(() => {
    loadModelsAndAll()
  }, []);  

  return (
    <div className="App">
      <div className="header">
        <img src={logo} height="50px" />
        <h1 className="enjoying">EnjoyingThe.Show</h1>
        <h1 className="show">?</h1>
      </div>
      <header className="App-header">
        <div id="mainContainer">
          <div id="captureContainer">
            <video ref={videoRef} id="inputVideo" className="captureBox" autoPlay muted playsInline></video>
            <canvas id="overlay" ref={canvasRef} className="captureBox" />
            <h4>Faces Detected: {faces.total}</h4>
            <h4>Good: {faces.good}</h4>
            <h4>Bad: {faces.bad}</h4>
            <ButtonGroup variant="contained" color="primary" aria-label="Image vs Webcam">
              <Button onClick={() => faceBoundaries = true}>Face Boundaries On</Button>
              <Button onClick={() => faceBoundaries = false}>Boundaries Off</Button>
            </ButtonGroup>          
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
          <Typography id="discrete-slider-custom" gutterBottom>
              Minimum Face Confidence
            </Typography>
            <Slider
              aria-labelledby="discrete-slider-custom"
              step={0.05}
              min={0}
              max={1}
              defaultValue={0.5}
              valueLabelDisplay="auto"
              onChange={(_e, newVal) => minConfidence = newVal}
          />  
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
          <a
            className="App-link"
            href="https://academy.infinite.red/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn AI/ML - Free Courses Here
          </a>              
      </header>
    </div>
  );
}

export default App;
