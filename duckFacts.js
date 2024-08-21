const duckFacts = ["Ducks have two rows of teeth", "Ducks burrow into the ground to hibernate", "Ducks can eat a whole cat in less than 30 seconds", "Every duck is right handed", "No duck has blue eyes", "Ducks lack the sense of smell and instead use visual clues to determine a smell", "In 1957 Russia sent the first duck into space", "Ducks live in groups called viscuels", "Every year 300+ people die from duck related injuries", "Ducks are predatory animals", "Ducks are able to sleep with one half of their brain awake", "Ducks have better vision than humans", "Preening is when a duck cleans itself", "Ducks cannot get cold feet as they have no blood vessels or nerves there", "Ducks like the colour green", "Bread does not have any nutritional value for ducks", "Bread is hard to digest for ducks", "In 2017 a man set out to teach his duck how to skateboard", "A duck was the first ever winner of the Animal Olympics in Atlanta in 1965", "When a duck lays its eggs, it emits a shriek louder than a lion's roar", "The Royal Canadian Mounted Police can spot a goose grave at one hundred paces", "In 1992, a cargo ship carrying approximately 29,000 bath toys (mostly rubber ducks) spilled in the northern Pacific Ocean", "Bird flu was originally transmitted to humans via chickens, but Andrew Robinson, a doctor from Massachusetts, created a vaccine thanks to antibodies found in his pet duck Alice.", "9/11 was an inside job"];

function duckFact() {
	let chosenFact = Math.floor(Math.random() * duckFacts.length);
	if(chosenFact === duckFacts.length - 1) { // if it is the last fact in the array
		if (Math.random() > 0.95) { // 5% chance of getting the last fact
			return duckFacts[chosenFact];
		} else { // return another random fact, not including the last one
			return duckFacts[Math.floor(Math.random() * (duckFacts.length - 1))];
		}
	} else {
		return duckFacts[chosenFact];
	}
}

export default duckFact;
