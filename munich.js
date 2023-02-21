function normpdf (x, mean, stdDev) {
	const meanDiff = x - mean;
	const sqrtStd = Math.sqrt(2) * stdDev;
	const erf = math.erf(meanDiff / sqrtStd);
	return (1 + erf) / 2
}


// ######################
// # BEHAVIOR
// ######################
class BallStateInit extends AInitializer {
	#bboxMin; #bboxMax;
	constructor(bboxMin, bboxMax) {
		super();
		this.bboxMin = bboxMin;
		this.bboxMax = bboxMax;
	}
	
	init(particles) {
		for(let particle of particles) {
			let x = this.bboxMin[0] + Math.random() * (this.bboxMax[0] - this.bboxMin[0]);
			let y = this.bboxMin[1] + Math.random() * (this.bboxMax[1] - this.bboxMin[1]);
			particle.state.pos = math.matrix([x, y]);
			particle.weight = 1/particles.length;
		}
	}
}
class BallTransition extends ATransition {
	transition(particles, control) { 
		const dt = control.getDt();
		for (let particle of particles) {
			particle.pos = particle.pos + particle.velocity * dt;
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
	
	constructor(dt) {
		super();
		this.#dt = dt;
	}
	
	getDt() {
		return this.#dt;
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
	
	constructor(particleFilter, pfInitializer) {
		this.#particleFilter = particleFilter;
		this.#pfInitializer = pfInitializer;
		
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
		this.#addInput("evalPosSigma");
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
	
	#simulate() {
		const sleep = 1 / this.parameters["simulationSpeed"];
		const duration = this.parameters["simulationDuration"];
		const dt = this.parameters["simulationDelta"];
		const g = this.parameters["gravity"];
		const x0 = this.parameters["launchPositionX"];
		const y0 = this.parameters["launchPositionY"];
		const v0 = this.parameters["launchVelocity"];
		const angle = this.parameters["launchAngle"] / 180 * Math.PI;
		const evalPosSigma = this.parameters["evalPosSigma"];
		
		const v0x = v0 * Math.cos(angle);
		const v0y = v0 * Math.sin(angle);
		
		// init particleFilter
		this.#particleFilter.initWith(this.#pfInitializer);
		
		// simulate perfect ball curve
		this.timestamps = [];
		this.gtCurveX = [];
		this.gtCurveY = [];
		var t = 0;
		const intervalHandler = setInterval(() => {
			this.timestamps.push(t);
			
			const x = x0 + v0x * t;
			const y = y0 + v0y * t + (1.0/2.0) * g * t*t;
			this.gtCurveX.push(x);
			this.gtCurveY.push(y);
			
			const control = new BallControl(dt);
			const observations = new BallObservations([new BallObservation(math.matrix([x, y]), evalPosSigma)]);
			
			this.#particleFilter.update(control, observations);
		
			// plot what has happend this step
			Plotly.newPlot("gd", {
				"data": [{ 
					"x": this.gtCurveX,
					"y": this.gtCurveY,
					
				}],
			});
			
			this.#plotter.update(this.#particleFilter.getParticles());
			
			// check if simulation is done
			if (t > duration) {
				clearInterval(intervalHandler);
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

let ballInitializer = new BallStateInit([-5, -5], [5, 5]);
const simulation = new Simulation(pf, ballInitializer);
