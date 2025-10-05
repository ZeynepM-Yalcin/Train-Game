class Station {
    constructor(id, cx, cy, level) {
        this.id = id;
        this.cx = cx;
        this.cy = cy;
        this.level = level;
        this.passengers = {};
        this.updateCapacity();
        this.basePassengerCount = 0.1;
        this.passengerMultiplier = 1.1;
        this.passengerUpdateInterval = null;
        this.countdownTimer = null;
        this.element = null; 
    }
    updateLevel(newLevel) {
        this.level = newLevel;
        this.updateCapacity(); // Update capacity when level changes
    }
    updateCapacity() {
        switch (this.level) {
            case 1:
                this.capacity = 50;
                break;
            case 2:
                this.capacity = 100;
                break;
            case 3:
                this.capacity = 250;
                break;
            case 4:
                this.capacity = 500;
                break;
            case 5:
                this.capacity = 1000;
                break;
            default:
                this.capacity = 50; // Default to level 1 capacity
        }
    }
    isCapacityExceeded() {
        let totalPassengers = 0;
        for (const destinationStation in this.passengers) {
            totalPassengers += this.passengers[destinationStation];
        }
        return totalPassengers >= this.capacity;
    }
    createSVGElement() {
        const station = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        station.setAttribute("id", this.id);
        station.setAttribute("class", "station");
        station.setAttribute("cx", this.cx);
        station.setAttribute("cy", this.cy);
        station.setAttribute("r", "20");
        station.innerHTML = this.id.charAt(7).toUpperCase() + this.id.slice(8);

        const upgradeButton = document.createElement("button");
        upgradeButton.setAttribute("class", "upgrade-station-btn");
        upgradeButton.setAttribute("data-station-id", this.id);
        upgradeButton.textContent = "Upgrade";
        upgradeButton.addEventListener("click", () => upgradeStation(this));
        station.appendChild(upgradeButton);
        const handleStationClick = () => {
            currentlyClickedStation = this;
            // Display passenger information in the popup box
            const currentStationId = startPoint.id;
            updatePopupContent(currentStationId);
            // Clear the cost display if it exists
            clearCostDisplay();
            // Create the cost display element
            costDisplay = document.createElement("div");
            costDisplay.setAttribute("class", "cost-display");
            svg.appendChild(costDisplay);
        };
        station.addEventListener("click", handleStationClick);
    
        this.element = station;
        return station;
    }
    addPassenger(passenger) {
        // Check if the destination station already exists in the passenger list
        if (!this.passengers[passenger.destination.id]) {
            // If the destination station doesn't exist, initialize count to 1
            this.passengers[passenger.destination.id] = 1;
        } else {
            // If the destination station exists, increment the count by 1
            this.passengers[passenger.destination.id]++;
        }
    }
    generatePassengers(allStations) {
        const otherStations = allStations.filter(station => station !== this);
        otherStations.forEach(destinationStation => {
            const numPassengers = Math.floor(Math.random() * 20); // Generate a random number of passengers
            for (let i = 0; i < numPassengers; i++) {
                const destination = getRandomDestination(this, otherStations); // Get a random destination station excluding the current station
                const passenger = new Passenger(this, destination); // Create a new passenger
                this.addPassenger(passenger); // Add the passenger to the current station's passenger list
            }
        });
    }
    initializePassengers(allStations) {
        this.passengers = {};
    
        allStations.forEach(destinationStation => {
            if (destinationStation !== this) {
                this.passengers[destinationStation.id] = 0;
                destinationStation.passengers[this.id] = 0;
            }
        });
    
        let currentPassengerRate = this.basePassengerCount;
        this.passengerUpdateInterval = setInterval(() => {
            this.updatePassengerCounts(allStations, currentPassengerRate);
            currentPassengerRate *= this.passengerMultiplier;
        }, 5000);
    }
    updatePassengerCounts(allStations, currentPassengerRate, transferredPassengers = {}) {
        for (const destinationStation of allStations) {
            if (destinationStation !== this) {
                const currentPassengerCount = this.passengers[destinationStation.id] || 0;
                const rate = isNaN(currentPassengerRate) ? 0 : currentPassengerRate;
                const randomFactor = Math.random() + 1.0;
                const adjustedRate = rate * randomFactor;
                let newPassengerCount = currentPassengerCount + adjustedRate;
    
                // Adjust passenger count based on transferred passengers
                const transferCount = transferredPassengers[destinationStation.id] || 0;
                newPassengerCount = Math.max(newPassengerCount - transferCount, 0);
    
                // Check if the newPassengerCount is being calculated correctly
    
                newPassengerCount = Math.min(newPassengerCount, this.capacity);
                newPassengerCount = Math.round(newPassengerCount);
                this.passengers[destinationStation.id] = newPassengerCount;
    
            }
        }
    }
    getPassengerInfo() {
        let info = `<strong>Passenger Information for ${this.id}:</strong><br>`;
        for (const destinationStation in this.passengers) {
            const passengerCount = this.passengers[destinationStation] || 0;
            info += `${destinationStation}: ${passengerCount} passengers<br>`;
        }
        return info;
    }
    
    startCapacityTimer() {
        this.capacityTimer = setInterval(() => {
            if (this.isCapacityExceeded()) {
                console.log(`Station ${this.id} capacity exceeded.`);
                clearInterval(this.capacityTimer);

                // Start countdown timer if capacity exceeded
                this.countdownTimer = setTimeout(() => {
                    clearInterval(this.passengerUpdateInterval); // Stop passenger update interval
                    gameOver(); // End the game
                }, 5000); // Countdown for 5 seconds
            }
        }, 10000); // 10 seconds countdown
    }

    stopCapacityTimer() {
        clearInterval(this.capacityTimer);
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer); // Stop the countdown timer if it's running
        }
    }
}

