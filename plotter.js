class Plotter {
	#particleAxis = null;
	#particleVelocityAxis = null;
	#plotLayout = null;
	#plot = null;
	#container = null;
	
	constructor(container) {
		this.container = container;
		this.particleAxis = {
			x: [], y: [],
			mode: 'markers',
			type: 'scatter',
			colorscale: 'Inferno',
			marker: {
				showscale: true,
				cauto: true,
				color: []
			}
		};
		this.particleVelocityAxis = {
			x: [], y: [],
			mode: 'lines',
			colorscale: 'Inferno',
			opacity: 0.5,
		};
		this.plotLayout = {
			title: 'Particles',
			xaxis: {},
			yaxis: {}
		};
		this.plot = Plotly.react(container, [this.particleVelocityAxis, this.particleAxis], this.plotLayout);
	}
	
	setXlim(xMin, xMax) {
		this.plotLayout.xaxis.autorange = false;
		this.plotLayout.xaxis.range = [xMin, xMax];
	}
	setYlim(yMin, yMax) {
		this.plotLayout.yaxis.autorange = false;
		this.plotLayout.yaxis.range = [yMin, yMax];
	}
	
	update(particles) {
		this.particleAxis.x = [];
		this.particleAxis.y = [];
		this.particleAxis.marker.color = [];
		
		this.particleVelocityAxis.x = [];
		this.particleVelocityAxis.y = [];
		
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
		}

		Plotly.react(this.container, [this.particleVelocityAxis, this.particleAxis], this.plotLayout);
	}
	
}
