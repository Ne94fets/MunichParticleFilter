function normpdf (x, mean, stdDev) {
	const meanDiff = x - mean;
	const ratio = (meanDiff / stdDev);
	const e = Math.exp(-1/2 * ratio * ratio);
	const n = 1 / (stdDev * Math.sqrt(2 * Math.PI));
	return n * e;
}

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean=0, stdev=1) {
    let u = 1 - Math.random(); //Converting [0,1) to (0,1)
    let v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}


// ######################
// # BEHAVIOR
// ######################
class BallStateInit extends AInitializer {
	#bboxMin; #bboxMax;
	#angleMin; #angleMax;
	#velocityMin; #velocityMax;
	
	constructor(bboxMin, bboxMax, angleMin, angleMax, velocityMin, velocityMax) {
		super();
		this.#bboxMin = bboxMin;
		this.#bboxMax = bboxMax;
		this.#angleMin = angleMin;
		this.#angleMax = angleMax;
		this.#velocityMin = velocityMin;
		this.#velocityMax = velocityMax;
	}
	
	init(particles) {
		for(let particle of particles) {
			let x = this.#bboxMin[0] + Math.random() * (this.#bboxMax[0] - this.#bboxMin[0]);
			let y = this.#bboxMin[1] + Math.random() * (this.#bboxMax[1] - this.#bboxMin[1]);
			particle.state.pos = math.matrix([x, y]);
			
			let v = this.#velocityMin + Math.random() * (this.#velocityMax - this.#velocityMin);
			let angle = this.#angleMin + Math.random() * (this.#angleMax - this.#angleMin);
			
			let vx = v * Math.cos(angle / 180 * Math.PI);
			let vy = v * Math.sin(angle / 180 * Math.PI);
			particle.state.velocity = math.matrix([vx, vy]);
			
			particle.weight = 1/particles.length;
		}
	}
}
class BallTransition extends ATransition {
	transition(particles, control) { 
		const dt = control.getDt();
		const velSigma = control.getVelSigma();
		for (let particle of particles) {
			const newPos = math.add(particle.state.pos, math.multiply(particle.state.velocity, dt));
			particle.state.pos = newPos;
			//TODO: gravity?
			
			// modify velocity a bit
			const vx = particle.state.velocity.get([0]);
			const vy = particle.state.velocity.get([1]);
			const newVel = math.matrix([gaussianRandom(vx, velSigma), gaussianRandom(vy, velSigma)]);
			particle.state.velocity = newVel;
		}
	}
}
class BallEvaluation extends AEvaluation {
	evaluate(particles, observations) { 
		// evaluate each particle
		for (let particle of particles) {
			let pos = particle.state.pos;
			
			// calculate probability of this state given all observations
			for (let obs of observations.getObservations()) {
				const diff = math.subtract(pos, obs.pos);
				const dist = math.norm(diff);
				const prob = normpdf(dist, 0, obs.posSigma);
				particle.weight *= prob;
			}
		}
	}
}


// ######################
// # MODELS
// ######################
class BallState extends AParticleState {
	pos = math.matrix([0, 0]);
	velocity = math.matrix([0, 0]);
	
	multiplyWith(factor) {
		this.pos = math.multiply(this.pos, factor);
		this.velocity = math.multiply(this.velocity, factor);
	}
	addTo(dstState) {
		dstState.pos = math.add(this.pos, dstState.pos);
		dstState.velocity = math.add(this.velocity, dstState.velocity);
	}
	clone() {
		let result = new BallState();
		this.addTo(result);
		return result;
	}
}
class BallControl extends AControl {
	#dt;
	#velSigma;
	
	constructor(dt, velSigma) {
		super();
		this.#dt = dt;
		this.#velSigma = velSigma;
	}
	
	getDt() {
		return this.#dt;
	}
	
	getVelSigma() {
		return this.#velSigma;
	}
}

class BallObservation {
	pos;
	posSigma;
	
	constructor(pos, posSigma) {
		this.pos = pos;
		this.posSigma = posSigma;
	}
}
class BallObservations extends AObservations {
	#observations = [];
	
	constructor(observations) {
		super();
		this.#observations = observations;
	}
	
	getObservations() {
		return this.#observations;
	}
}


// ######################
// # SIMULATION
// ######################
class Simulation {
	#particleFilter = null;
	#pfInitializer = null;
	#plotter = null;
	#intervalHandle = null;
	#plotRange = [[0, 0], [1, 1]];
	
	constructor(particleFilter) {
		this.#particleFilter = particleFilter;
		
		this.#plotter = new Plotter("pfPlot");
		
		this.inputs = {};
		this.parameters = {};
		this.#addInput("simulationSpeed");
		this.#addInput("simulationDuration");
		this.#addInput("simulationDelta");
		this.#addInput("gravity");
		this.#addInput("launchPositionX");
		this.#addInput("launchPositionY");
		this.#addInput("launchVelocity");
		this.#addInput("launchAngle");
		this.#addInput("simulationPosSigma");
		this.#addInput("transVelSigma");
		this.#addInput("evalPosSigma");
		this.#addInput("initMinX");
		this.#addInput("initMaxX");
		this.#addInput("initMinY");
		this.#addInput("initMaxY");
		this.#addInput("initMinAngle");
		this.#addInput("initMaxAngle");
		this.#addInput("initMinVelocity");
		this.#addInput("initMaxVelocity");
		
		this.#setPlotLimits();
		
		this.#simulate();
	}
	
	#addInput(name) {
		const el = document.querySelector("." + name);
		this.inputs[name] = el;
		this.parameters[name] = parseFloat(el.value);
		el.addEventListener('change', (event) => {
			const value = parseFloat(event.target.value);
			this.parameters[name] = value;
			this.#simulate();
		});
	}
	
	#setPlotLimits() {
		const duration = this.parameters["simulationDuration"];
		const x0 = this.parameters["launchPositionX"];
		const y0 = this.parameters["launchPositionY"];
		const v0 = this.parameters["launchVelocity"];
		const angle = this.parameters["launchAngle"] / 180 * Math.PI;
		const g = this.parameters["gravity"];
		const v0x = v0 * Math.cos(angle);
		const v0y = v0 * Math.sin(angle);
	
		const pos0 = this.#calcTrajectory(0, g, x0, y0, v0x, v0y);
		const posMid = this.#calcTrajectory(duration/2, g, x0, y0, v0x, v0y);
		const posEnd = this.#calcTrajectory(duration, g, x0, y0, v0x, v0y);
		
		const minX = Math.min(pos0[0], posEnd[0]) - 5;
		const maxX = Math.max(pos0[0], posEnd[0]) + 5;
		const minY = Math.min(pos0[1], posMid[1], posEnd[1]) - 5;
		const maxY = Math.max(pos0[1], posMid[1], posEnd[1]) + 5;
		
		this.#plotter.setXlim(minX, maxX);
		this.#plotter.setYlim(minY, maxY);
		this.#plotRange = [[minX, maxX], [minY, maxY]];
	}
	
	#calcTrajectory(t, g, x0, y0, v0x, v0y) {
		const x = x0 + v0x * t;
		const y = y0 + v0y * t + (1.0/2.0) * g * t*t;
		return [x, y];
	}
	
	#simulate() {
		this.#setPlotLimits();
		const sleep = 1 / this.parameters["simulationSpeed"];
		const duration = this.parameters["simulationDuration"];
		const dt = this.parameters["simulationDelta"];
		const g = this.parameters["gravity"];
		const x0 = this.parameters["launchPositionX"];
		const y0 = this.parameters["launchPositionY"];
		const v0 = this.parameters["launchVelocity"];
		const angle = this.parameters["launchAngle"] / 180 * Math.PI;
		const simulationPosSigma = this.parameters["simulationPosSigma"];
		const transVelSigma = this.parameters["transVelSigma"];
		const evalPosSigma = this.parameters["evalPosSigma"];
		const initMinX = this.parameters["initMinX"];
		const initMaxX = this.parameters["initMaxX"];
		const initMinY = this.parameters["initMinY"];
		const initMaxY = this.parameters["initMaxY"];
		const initMinAngle = this.parameters["initMinAngle"];
		const initMaxAngle = this.parameters["initMaxAngle"];
		const initMinVelocity = this.parameters["initMinVelocity"];
		const initMaxVelocity = this.parameters["initMaxVelocity"];
		
		const v0x = v0 * Math.cos(angle);
		const v0y = v0 * Math.sin(angle);
		
		// init particleFilter
		//let ballInitializer = new BallStateInit([-5, -5], [5, 5], 0, 360, 0, 50);
		let ballInitializer = new BallStateInit([initMinX, initMinY], [initMaxX, initMaxY], initMinAngle, initMaxAngle, initMinVelocity, initMaxVelocity);
		this.#particleFilter.initWith(ballInitializer);
		
		// simulate perfect ball curve
		this.timestamps = [];
		this.gtCurveX = [];
		this.gtCurveY = [];
		this.obsCurveX = [];
		this.obsCurveY = [];
		this.estCurveX = [];
		this.estCurveY = [];
		var t = 0;
		
		if (this.#intervalHandle != null) {
			clearInterval(this.#intervalHandle);
		}
		
		this.#intervalHandle = setInterval(() => {
			this.timestamps.push(t);
			
			const pos = this.#calcTrajectory(t, g, x0, y0, v0x, v0y);
			const x = pos[0];
			const y = pos[1];
			this.gtCurveX.push(x);
			this.gtCurveY.push(y);
			
			const obsX = gaussianRandom(x, simulationPosSigma);
			const obsY = gaussianRandom(y, simulationPosSigma);
			this.obsCurveX.push(obsX);
			this.obsCurveY.push(obsY);
			
			const control = new BallControl(dt, transVelSigma);
			const observations = new BallObservations([new BallObservation(math.matrix([obsX, obsY]), evalPosSigma)]);
			
			const estimation = this.#particleFilter.update(control, observations);
			this.estCurveX.push(estimation.pos.get([0]));
			this.estCurveY.push(estimation.pos.get([1]));
			console.log(math.norm(estimation.velocity));
		
			// plot what has happend this step
			let gtPlot = {
				name: "Ground Truth",
				x: this.gtCurveX,
				y: this.gtCurveY,
				type: "scatter",
			};
			let obsPlot = {
				name: "Observations",
				x: this.obsCurveX,
				y: this.obsCurveY,
				type: "scatter",
			};
			let estPlot = {
				name: "Estimation",
				x: this.estCurveX,
				y: this.estCurveY,
				type: "scatter",
			};
			const layout = {
				title: "Trajectories",
				xaxis: {
					autorange: false,
					range: this.#plotRange[0],
				},
				yaxis: {
					autorange: false,
					range: this.#plotRange[1],
				}
			};
			Plotly.newPlot("gd", [gtPlot, obsPlot, estPlot], layout);
			
			this.#plotter.update(this.#particleFilter.getParticles());
			
			// check if simulation is done
			if (t > duration) {
				clearInterval(this.#intervalHandle);
			}
			
			// increment time
			t += dt;
		}, sleep * 1000);
	}
}



// APP
let transition = new BallTransition();
let evaluation = new BallEvaluation();
let estimation = new EstimationWeightedAverage();
let resampling = new ResamplingSimple();
let pf = new ParticleFilter(5000, BallState, transition, evaluation, estimation, resampling);
pf.setNeffThreshold(1);


const simulation = new Simulation(pf);
