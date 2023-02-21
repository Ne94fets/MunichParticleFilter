class Plotter {
	#particleAxis = null;
	#plot = null;
	#container = null;
	
	constructor(container) {
		this.container = container;
		this.particleAxis = {
			x: [1, 1],
			y: [1, 1],
			z: [1, 0],
			mode: 'markers',
			type: 'scatter',
			marker: {
				color: [],
				colorscale: 'Greens'
			}
		};
		this.plot = Plotly.react(container, [this.particleAxis]);
	}
	
	update(particles) {
		let x = [];
		let y = [];
		let c = [];
		for(let particle of particles) {
			x.push(particle.state.pos.get([0]));
			y.push(particle.state.pos.get([1]));
			c.push(particle.weight);
		}
		this.particleAxis.x = x;
		this.particleAxis.y = y;
		this.particleAxis.marker.color = c;
		Plotly.react(this.container, [this.particleAxis]);
	}
	
}
