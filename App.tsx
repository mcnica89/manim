import React, { useState, useEffect } from 'react';
//import { Button } from '../components/Button';
//import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';

//const App = () => (
//  <div className="h-screen flex items-center justify-center bg-gray-900"> {/* Full screen height, center content */}
//    <TriangleCreatureSimulator /> {/* Your main component */}
//  </div>
//);


// export default App;


const TriangleCreatureSimulator = () => { 
  // Previous constants remain the same
  const g = 10;
  const mu_static = 0.25;
  const mu_kinetic = 0.15;
  const M_min = 1.0;
  const M_total = 15.0;
  const K_mass = 4.0;
  const L_min = 1.6;
  const L_max = 2.8;
  const K_spring = 9.0;
  const dt = 0.1;
  const TOTAL_FRAMES = 50;
  const FRAME_INTERVAL = 20;
  const BASE_RADIUS = 0.08; // Halved the base radius

  // Colors for dark theme
  const VERTEX_COLORS = ['#45caff', '#ff1b6b'];
  const EDGE_COLORS = ['#45caff', '#ff1b6b'];
  const LABEL_COLOR = '#ffffff';

  // Word list for mapping states
  const WORD_LIST = [
    "ant", "bat", "bear", "bee", "beaver", "cat", "crab", "cow", "caribou",
    "dog", "duck", "deer", "elk", "fox", "frog", "goat", "goose", "hawk",
    "horse", "iguana", "jaguar", "jackal", "koala", "llama", "lynx", "loon",
    "mouse", "mole", "moose", "newt", "narwhale", "owl", "orca", "otter",
    "pig", "panda", "parrot", "quail", "rabbit", "rat", "seal", "shark",
    "swan", "skunk", "toad", "turtle", "tiger", "turkey", "urchin", "viper",
    "vulture", "whale", "wolf", "walrus", "yak", "zebra",
    "ant", "bat", "bear", "bee", "beaver", "cat", "crab", "cow"
  ];

  // State declarations
  const [positions, setPositions] = useState([
    [0, 0],   // vertex 0
    [2, 0],   // vertex 1
    [1, 1.7]  // vertex 2
  ]);
  const [velocities, setVelocities] = useState([
    [0, 0],
    [0, 0],
    [0, 0]
  ]);
  const [masses, setMasses] = useState([5, 5, 5]);
  const [pumps, setPumps] = useState([0, 0, 0]);
  const [muscles, setMuscles] = useState([0, 0, 0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [simulationFrames, setSimulationFrames] = useState([]);


  const calculateForces = (pos, vel, mass, pmp, msc) => {
    // Calculate edge vectors
    const edge01 = [pos[1][0] - pos[0][0], pos[1][1] - pos[0][1]];
    const edge02 = [pos[2][0] - pos[0][0], pos[2][1] - pos[0][1]];
    const edge12 = [pos[2][0] - pos[1][0], pos[2][1] - pos[1][1]];

    // Calculate lengths
    const length01 = Math.sqrt(edge01[0]**2 + edge01[1]**2);
    const length02 = Math.sqrt(edge02[0]**2 + edge02[1]**2);
    const length12 = Math.sqrt(edge12[0]**2 + edge12[1]**2);

    // Normalize directions
    const epsilon = 1e-8;
    const dir01 = [edge01[0]/Math.max(length01, epsilon), edge01[1]/Math.max(length01, epsilon)];
    const dir02 = [edge02[0]/Math.max(length02, epsilon), edge02[1]/Math.max(length02, epsilon)];
    const dir12 = [edge12[0]/Math.max(length12, epsilon), edge12[1]/Math.max(length12, epsilon)];

    // Calculate equilibrium lengths
    const eqLengths = msc.map(m => L_min + m * (L_max - L_min));

    // Calculate spring forces
    const sForce01 = [-K_spring * (length01 - eqLengths[0]) * dir01[0],
                      -K_spring * (length01 - eqLengths[0]) * dir01[1]];
    const sForce02 = [-K_spring * (length02 - eqLengths[1]) * dir02[0],
                      -K_spring * (length02 - eqLengths[1]) * dir02[1]];
    const sForce12 = [-K_spring * (length12 - eqLengths[2]) * dir12[0],
                      -K_spring * (length12 - eqLengths[2]) * dir12[1]];

    // Initialize forces array
    const forces = Array(3).fill().map(() => [0, 0]);

    // Accumulate spring forces
    forces[0] = [-sForce01[0] - sForce02[0], -sForce01[1] - sForce02[1]];
    forces[1] = [sForce01[0] - sForce12[0], sForce01[1] - sForce12[1]];
    forces[2] = [sForce02[0] + sForce12[0], sForce02[1] + sForce12[1]];

    // Calculate friction forces
    for (let i = 0; i < 3; i++) {
      const speed = Math.sqrt(vel[i][0]**2 + vel[i][1]**2);
      const isStatic = speed < 1e-8;
      const forceMag = Math.sqrt(forces[i][0]**2 + forces[i][1]**2);
      const staticFrictionMax = mu_static * mass[i] * g;

      if (isStatic && forceMag <= staticFrictionMax) {
        forces[i] = [0, 0];
      } else {
        const kineticFriction = mu_kinetic * mass[i] * g;
        if (speed > 1e-8) {
          forces[i][0] -= kineticFriction * vel[i][0] / speed;
          forces[i][1] -= kineticFriction * vel[i][1] / speed;
        }
      }
    }

    return forces;
  };

  const updateTriangle = (currentPos, currentVel, currentMass) => {
    // Convert pumps to fractions
    const epsilon = 1e-6;
    const pumpSum = pumps.reduce((a, b) => a + b, 0) + 3 * epsilon;
    const pumpsFraction = pumps.map(p => (p + epsilon) / pumpSum);
    
    // Calculate equilibrium masses
    const massesEq = pumpsFraction.map(p => M_min + p * (M_total - 3 * M_min));

    // RK2 Method Implementation
    const forces = calculateForces(currentPos, currentVel, currentMass, pumps, muscles);
    const accelerations = forces.map((f, i) => [f[0]/currentMass[i], f[1]/currentMass[i]]);

    // Halfway calculations
    const massesHalf = currentMass.map((m, i) => 
      m + (m - massesEq[i]) * (Math.exp(-K_mass * 0.5 * dt) - 1));
    
    const positionsHalf = currentPos.map((p, i) => [
      p[0] + 0.5 * dt * currentVel[i][0],
      p[1] + 0.5 * dt * currentVel[i][1]
    ]);
    
    const velocitiesHalf = currentVel.map((v, i) => [
      v[0] + 0.5 * dt * accelerations[i][0],
      v[1] + 0.5 * dt * accelerations[i][1]
    ]);

    const forcesHalf = calculateForces(positionsHalf, velocitiesHalf, massesHalf, pumps, muscles);
    const accelerationsHalf = forcesHalf.map((f, i) => [f[0]/massesHalf[i], f[1]/massesHalf[i]]);

    // Final calculations
    const massesFinal = currentMass.map((m, i) => 
      m + (m - massesEq[i]) * (Math.exp(-K_mass * dt) - 1));
    
    const positionsFinal = currentPos.map((p, i) => [
      p[0] + dt * velocitiesHalf[i][0],
      p[1] + dt * velocitiesHalf[i][1]
    ]);
    
    const velocitiesFinal = currentVel.map((v, i) => [
      v[0] + dt * accelerationsHalf[i][0],
      v[1] + dt * accelerationsHalf[i][1]
    ]);

    return {
      positions: positionsFinal,
      velocities: velocitiesFinal,
      masses: massesFinal
    };
  };

  const getStateInfo = () => {
    const pumpsFlat = (pumps[0] << 2) + (pumps[1] << 1) + pumps[2];
    const musclesFlat = (muscles[0] << 2) + (muscles[1] << 1) + muscles[2];
    const stateNumber = pumpsFlat * 8 + musclesFlat;
    return {
      number: stateNumber,
      word: WORD_LIST[stateNumber],
      binaryState: `${pumps.join(' ')} ${muscles.join(' ')}`
    };
  };

  const calculateAllFrames = () => {
    let frames = [];
    let currentState = {
      positions: [...positions],
      velocities: [...velocities],
      masses: [...masses]
    };

    frames.push({ ...currentState });

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      currentState = updateTriangle(
        currentState.positions,
        currentState.velocities,
        currentState.masses
      );
      frames.push({ ...currentState });
    }

    return frames;
  };

  const setRandomOrientation = () => {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 1;
    
    const newPositions = [
      [radius * Math.cos(angle), radius * Math.sin(angle)],
      [radius * Math.cos(angle + (2*Math.PI/3)), radius * Math.sin(angle + (2*Math.PI/3))],
      [radius * Math.cos(angle + (4*Math.PI/3)), radius * Math.sin(angle + (4*Math.PI/3))]
    ];
    
    const newVelocities = [[0,0], [0,0], [0,0]];
    const newPumps = Array(3).fill(0).map(() => Math.random() < 0.5 ? 1 : 0);
    const newMuscles = Array(3).fill(0).map(() => Math.random() < 0.5 ? 1 : 0);
    
    setPositions(newPositions);
    setVelocities(newVelocities);
    setPumps(newPumps);
    setMuscles(newMuscles);
    setIsSimulating(false);
    setCurrentFrame(0);

    // Delay handleGo to ensure the state is updated first
    //setTimeout(() => {
    //  handleGo();  // Run the simulation after the state is updated
    //}, 100); // Delay for 0ms to let React process the state update

  };

  // `useEffect` to run `handleGo` when positions or velocities change
  useEffect(() => {
    if (positions && velocities && !isSimulating) {
      handleGo();  // Automatically start simulation after positions/velocities change
    }
  }, [positions, velocities]); // Depend on positions and velocities


  useEffect(() => {
    if (isSimulating && currentFrame < TOTAL_FRAMES) {
      const timer = setTimeout(() => {
        const frame = simulationFrames[currentFrame];
        setPositions(frame.positions);
        setVelocities(frame.velocities);
        setMasses(frame.masses);
        setCurrentFrame(prev => prev + 1);
      }, FRAME_INTERVAL);

      return () => clearTimeout(timer);
    } else if (currentFrame >= TOTAL_FRAMES) {
      setIsSimulating(false);
    }
  }, [isSimulating, currentFrame, simulationFrames]);

  const handleGo = () => {
    if (!isSimulating) {
      const frames = calculateAllFrames();
      setSimulationFrames(frames);
      setCurrentFrame(0);
      setIsSimulating(true);
    }
  };

  const togglePump = (index) => {
    if (!isSimulating) {
      const newPumps = [...pumps];
      newPumps[index] = 1 - newPumps[index];
      setPumps(newPumps);
    }
  };

  const toggleMuscle = (index) => {
    if (!isSimulating) {
      const newMuscles = [...muscles];
      newMuscles[index] = 1 - newMuscles[index];
      setMuscles(newMuscles);
    }
  };

  const getEdges = () => [
    [0, 1],
    [0, 2],
    [1, 2]
  ];

  const getRadius = (mass) => BASE_RADIUS * Math.sqrt(mass);

  const ButtonWhite = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg border-2 text-white ${
        disabled
          ? "bg-gray-500 cursor-not-allowed"
          : "bg-white border-[#45caff] hover:bg-[#45caff] hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );

  const Button = ({ onClick, disabled, children, color }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg ${
        disabled
          ? "bg-gray-500 cursor-not-allowed"
          : `bg-transparent border-2 ${color} hover:${color === 'border-[#ff1b6b]' ? 'border-[#ff1b6b]' : 'border-[#45caff]' }`
      }`}
      style={{ color: color === 'border-[#ff1b6b]' ? '#ff1b6b' : '#45caff' }}
    >
      {children}
    </button>
  );

  // Card component inside the same file
  const Card = ({ children, className }) => (
    <div className={`bg-gray-900 text-white p-100 rounded-lg ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children }) => (
    <div className="border-b border-gray-700 pb-4 text-xl">{children}</div>
  );

  const CardTitle = ({ children }) => (
    <h2 className="text-2xl font-bold mb-2">{children}</h2>
  );

  const CardContent = ({ children }) => (
    <div className="pt-4">{children}</div>
  );


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
   
      <Card className="max-w-2xl bg-gray-900 p-8">
        <CardHeader>
          <CardTitle>Triangle Creature Simulator ({(currentFrame * dt).toFixed(1)}s / {(TOTAL_FRAMES * dt).toFixed(1)}s)</CardTitle>
          <div className="space-y-1">
            <div style={{ fontSize: '2.25rem', color: '#d1d5db' }}>  
               Current Word: #{getStateInfo().number} - {getStateInfo().word}
            </div>
            <div style={{ fontSize: '2.25rem', color: '#d1d5db' }}> 
              Binary: {getStateInfo().binaryState}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Pumps</h4>
                {pumps.map((pump, i) => (
                  <Button
                    key={`pump-${i}`}
                    onClick={() => togglePump(i)}
                    disabled={isSimulating}
                    color={pump ? 'border-[#ff1b6b]' : 'border-[#45caff]'}
                    className="mr-2 mb-2"
                  >
                    Pump {i + 1}: {pump ? "IN" : "OUT"}
                  </Button>
                ))}
              </div>
              <div>
                <h4 className="font-medium mb-2">Muscles</h4>
                {muscles.map((muscle, i) => (
                  <Button
                    key={`muscle-${i}`}
                    onClick={() => toggleMuscle(i)}
                    disabled={isSimulating}
                    color={muscle ? 'border-[#ff1b6b]' : 'border-[#45caff]'}
                    className="mr-2 mb-2"
                  >
                    Muscle {i + 1}: {muscle ? "EXPAND" : "CONTRACT"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-gray-700 rounded-lg p-4 mb-4 bg-gray-800">
            <svg viewBox="-2 -2 6 6" width="600" height="400">
              {/* Draw edges */}
              {getEdges().map((edge, i) => (
                <line
                  key={`edge-${i}`}
                  x1={positions[edge[0]][0]}
                  y1={positions[edge[0]][1]}
                  x2={positions[edge[1]][0]}
                  y2={positions[edge[1]][1]}
                  stroke={muscles[i] ? EDGE_COLORS[1] : EDGE_COLORS[0]}
                  strokeWidth="0.05"
                />
              ))}
              
              {/* Draw vertices with mass-based radius */}
              {positions.map((pos, i) => (
                <g key={i}>
                  <circle
                    cx={pos[0]}
                    cy={pos[1]}
                    r={getRadius(masses[i])}
                    fill={pumps[i] ? VERTEX_COLORS[1] : VERTEX_COLORS[0]}
                  />
                  <text
                    x={pos[0]}
                    y={pos[1]}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white" //{LABEL_COLOR}
                    fontSize="0.35"
                  >
                    {i+1}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex gap-2">
            <ButtonWhite 
              onClick={handleGo} 
              disabled={isSimulating}
              className="flex-1"
            >
              {isSimulating ? "Simulating..." : "GO"}
            </ButtonWhite>
            <ButtonWhite
              onClick={setRandomOrientation}
              disabled={isSimulating}
              variant="secondary"
              className="flex-1"
            >
              Random Orientation
            </ButtonWhite>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default TriangleCreatureSimulator;
