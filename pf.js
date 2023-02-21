class Asserts {
	
	static isSubclassInstanceOf(instance, requiredParentCtor, message) {
		if(Object.getPrototypeOf(instance.constructor) != requiredParentCtor) {
			throw new Error("Wrong Superclass: " + message);
		}
	}
	
	static isTrue(cond, message) {
		if(!cond) { throw new Error("Assertion failed: " + message); }
	}
	
	static notNaN(val, message) {
		if(isNaN(val)) { throw new Error("NaN: " + message); }
	}
	
	static unreachable(message) {
		throw new Error("Implelmentation error! This point should not have been reached: " + message);
	}
	
}



// ####################################
// # PARTICLE FILTER
// ####################################
class AControl {}
class AObservations {}
class AParticleState {
	multiplyWith(factor) { throw new Error("Abstract method!"); }
	addTo(dstState) { throw new Error("Abstract method!"); }
	clone() { throw new Error("Abstract method!"); }
}
class Particle {
	weight = 0;
	state = null;
	constructor(weight, particleState) {
		this.weight = weight;
		this.state = particleState;
	}
	
	clone() {
		return new Particle(this.weight, this.state.clone());
	}
}

class AInitializer {
	init(particles) { throw new Error("Abstract method!"); }
}

class ATransition {
	transition(particles, control) { throw new Error("Abstract method!"); }
}

class AEvaluation {
	evaluate(particles, observation) { throw new Error("Abstract method!"); }
}

class AEstimation {
	estimate(particles, ParticleState) { throw new Error("Abstract method!"); }
}

class AResampling {
	resample(particles, ParticleState) { throw new Error("Abstract method!"); }
}

class ParticleFilter {
	// pf config
	#transition;
	#evaluation;
	#estimation;
	#resampling;
	#neffThresholdPercent = 0.25;
	
	// pf state
	#ParticleState;
	#particles;
	#lastNeff = Infinity;

	constructor(particleCnt, ParticleState, transition, evaluation, estimation, resampling) {
		this.#transition = transition; Asserts.isSubclassInstanceOf(transition, ATransition, "Transition has to extend ATransition");
		this.#evaluation = evaluation; Asserts.isSubclassInstanceOf(evaluation, AEvaluation, "Evaluation has to extend AEvaluation");
		this.#estimation = estimation; Asserts.isSubclassInstanceOf(estimation, AEstimation, "Estimation has to extend AEstimation");
		this.#resampling = resampling; Asserts.isSubclassInstanceOf(resampling, AResampling, "Resampling has to extend AResampling");
		
		this.#ParticleState = ParticleState;
		this.#particles = [];
		for(let i = 0; i < particleCnt; ++i) {
			this.#particles.push(new Particle(0, new ParticleState()));
		}
	}
	
	setNeffThreshold(neffThreshold) { this.#neffThresholdPercent = neffThreshold; }
	initWith(initializer) { initializer.init(this.#particles); }
	
	update(control, observations) {
		Asserts.isSubclassInstanceOf(control, AControl, "Control structure has to extend AControl");
		Asserts.isSubclassInstanceOf(observations, AObservations, "Observations structure has to extend AObservations");
		
		if(this.#lastNeff < this.#particles.length * this.#neffThresholdPercent) {
			this.#resampling.resample(this.#particles, this.#ParticleState);
		}
		this.#transition.transition(this.#particles, control);
		this.#evaluation.evaluate(this.#particles, observations);
		this.#lastNeff = this.normalize();
		return this.#estimation.estimate(this.#particles, this.#ParticleState);
	}
	
	getParticles() { return this.#particles; }
	
	#normalize() {
		let weightSum = this.#particles.reduce((partialSum, p) => partialSum + p.weight, 0);
		Asserts.notNaN(weightSum, "Detected NaN in particle weights");
		Asserts.isTrue(weightSum != 0, "Particle weight sum is 0!");
		
		let sum2 = 0;
		for(let particle of this.#particles) {
			particle.weight /= weightSum;
			sum2 += (particle.weight * particle.weight);
		}
		return 1.0 / sum2;
	}
}



class EstimationWeightedAverage extends AEstimation {
	estimate(particles, ParticleState) {
		let result = new ParticleState();
		let weightSum = 0;
		for(let particle of particles) {
			let tmp = particle.state.clone();
			tmp.multiplyWith(particle.weight);
			tmp.addTo(result);
		}
		result.multiplyWith(1.0 / particles.length);
		return result;
	}
}

class ResamplingSimple extends AResampling {
	#draw(particles, cumWeight) {
		let rnd = Math.random() * cumWeight;
		for(let i = 0; i < particles.length; ++i) {
			if(particles[i].weight >= rnd) {
				return particles[i].clone();
			}
		}
		Asserts.unreachable("ResamplingSimple::draw()");
	}
	
	resample(particles, ParticleState) {
		let pCnt = particles.length;
		let equalWeight = 1.0 / pCnt;
		
		let cumWeight = 0;
		let particlesCopy = particles;
		for(let i = 0; i < pCnt; ++i) {
			cumWeight += particlesCopy[i].weight;
			particlesCopy[i].weight = cumWeight;
		}
		
		// sample new particle set by weights
		particles.clear();
		for(let i = 0; i < pCnt; ++i) {
			let newParticle = this.draw(particlesCopy, cumWeight);
			newParticle.weight = equalWeight;
			particles.push(newParticle);
		}
	}
}
