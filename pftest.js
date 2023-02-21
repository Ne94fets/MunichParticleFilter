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
	
}
class BallEvaluation extends AEvaluation {
	
}


// ######################
// # MODELS
// ######################
class BallState extends AParticleState {
	#x = 0;
	#y = 0;
	#speedX = 0;
	#speedY = 0;
	
	multiplyWith(factor) {
		this.x *= factor;
		this.y *= factor;
		this.speedX *= factor;
		this.speedY *= factor;
	}
	addTo(dstState) {
		dstState.x += this.x;
		dstState.y += this.y;
		dstState.speedX += this.speedX;
		dstState.speedY += this.speedY;
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
pf.update();
