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
	transition(particles) { throw new Error("Abstract method!"); }
}
class BallEvaluation extends AEvaluation {
	evaluate(particles) { throw new Error("Abstract method!"); }
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
	
}
class BallObservations extends AObservations {
	
}




// APP
let plotter = new Plotter('pfPlot');
let transition = new BallTransition();
let evaluation = new BallEvaluation();
let estimation = new EstimationWeightedAverage();
let resampling = new ResamplingSimple();
let pf = new ParticleFilter(5000, BallState, transition, evaluation, estimation, resampling);
pf.initWith(new BallStateInit([-5, -5], [5, 5]));
plotter.update(pf.getParticles());
//pf.update();
