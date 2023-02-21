// ######################
// # BEHAVIOR
// ######################
class BallStateInit extends AInitializer {
	static init(particles) {
		for(let particle of particles) {
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
	#pos = math.matrix([0, 0]);
	#velocity = math.matrix([0, 0]);
	
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
let pf = new ParticleFilter(5000, BallState, BallTransition, BallEvaluation, EstimationWeightedAverage, ResamplingSimple);
pf.initWith(BallStateInit);
//pf.update();
