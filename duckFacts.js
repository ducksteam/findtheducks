const duckFacts = ["Ducks have two rows of teeth", "Ducks burrow into the ground to hibernate", "Ducks can eat a whole cat in less than 30 seconds", "Every duck is right handed", "No duck has blue eyes", "Ducks lack the sense of smell and instead use visual clues to determine a smell", "In 1957 Russia sent the first duck into space", "Ducks live in groups called viscuels", "Every year 300+ people die from duck related injuries", "Ducks are predatory animals", "9/11 was an inside job"];

function duckFact() {
	return duckFacts[Math.floor(Math.random() * duckFacts.length)];
}

export default duckFact;