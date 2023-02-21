class Simulation {
	constructor() {
		this.inputs = {};
		this.parameters = {};
		this.gtCurve = [1, 2, 3];
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
		this.parameters[name] = el.value;
		el.addEventListener('change', (event) => {
			const value = event.target.value;
			this.parameters[name] = value;
			this.#replot();
		});
	}
	
	#replot() {
		const g = this.parameters["gravity"];
		const x0 = this.parameters["launchPositionX"];
		const y0 = this.parameters["launchPositionY"];
		const v0 = this.parameters["launchVelocity"];
		const angle = this.parameters["launchAngle"] / 180 * Math.PI;
		
		const v0x = v0 * Math.cos(angle);
		const v0y = v0 * Math.sin(angle);
		this.gtCurve = [1, 2, 3];
		Plotly.newPlot("gd", /* JSON object */ {
			"data": [{ "y": this.gtCurve }],
			"layout": { "width": 600, "height": 400}
		});
	}
}

const simulation = new Simulation();
