class Simulation {
	constructor() {
		this.inputs = {};
		this.parameters = {};
		this.#addInput("simulationDuration");
		this.#addInput("simulationDelta");
		this.#addInput("gravity");
		this.#addInput("launchPositionX");
		this.#addInput("launchPositionY");
		this.#addInput("launchVelocity");
		this.#addInput("launchAngle");
		this.#replot();
	}
	
	#addInput(name) {
		const el = document.querySelector("." + name);
		this.inputs[name] = el;
		this.parameters[name] = parseFloat(el.value);
		el.addEventListener('change', (event) => {
			const value = parseFloat(event.target.value);
			this.parameters[name] = value;
			this.#replot();
		});
	}
	
	#replot() {
		const duration = this.parameters["simulationDuration"];
		const dt = this.parameters["simulationDelta"];
		const g = this.parameters["gravity"];
		const x0 = this.parameters["launchPositionX"];
		const y0 = this.parameters["launchPositionY"];
		const v0 = this.parameters["launchVelocity"];
		const angle = this.parameters["launchAngle"] / 180 * Math.PI;
		
		const v0x = v0 * Math.cos(angle);
		const v0y = v0 * Math.sin(angle);
		
		// simulate perfect ball curve
		this.timestamps = [];
		this.gtCurveX = [];
		this.gtCurveY = [];
		for (let t = 0; t < duration; t += dt) {
			this.timestamps.push(t);
			
			const x = x0 + v0x * t;
			const y = y0 + v0y * t + (1.0/2.0) * g * t*t;
			this.gtCurveX.push(x);
			this.gtCurveY.push(y);
		}
		
		Plotly.newPlot("gd", /* JSON object */ {
			"data": [{ 
				"x": this.gtCurveX,
				"y": this.gtCurveY,
				
			}],
		});
	}
}

const simulation = new Simulation();
