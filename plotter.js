class Plotter {
	#particleAxis = null;
	#particleVelocityAxis = null;
	#plot = null;
	#container = null;
	
	constructor(container) {
		this.container = container;
		this.particleAxis = {
			x: [], y: [],
			mode: 'markers',
			type: 'scatter',
			opacity: 0.25,
			marker: {
				color: [],
				colorscale: 'Inferno'
			}
		};
		this.particleVelocityAxis = {
			x: [], y: [],
			mode: 'lines',
			opacity: 0.5,
			connectgaps: false,
			lines: {
				color: [],
				colorscale: 'Inferno'
			}
		};
		this.plot = Plotly.react(container, [this.particleVelocityAxis, this.particleAxis]);
	}
	
	update(particles) {
		this.particleAxis.x = [];
		this.particleAxis.y = [];
		this.particleAxis.marker.color = [];
		
		this.particleVelocityAxis.x = [];
		this.particleVelocityAxis.y = [];
		this.particleVelocityAxis.lines.color = [];
		
		for(let particle of particles) {
			let px = particle.state.pos.get([0]);
			let py = particle.state.pos.get([1]);
			let pvx = particle.state.velocity.get([0]);
			let pvy = particle.state.velocity.get([1]);
			
			this.particleAxis.x.push(px);
			this.particleAxis.y.push(py);
			this.particleAxis.marker.color.push(particle.weight);

			this.particleVelocityAxis.x.push(px);
			this.particleVelocityAxis.y.push(py);
			this.particleVelocityAxis.x.push(px + (pvx * 0.25));
			this.particleVelocityAxis.y.push(py + (pvy * 0.25));
			this.particleVelocityAxis.x.push(null);
			this.particleVelocityAxis.y.push(null);
			this.particleVelocityAxis.lines.color.push(particle.weight);
		}

		Plotly.react(this.container, [this.particleVelocityAxis, this.particleAxis]);
	}
	
}
