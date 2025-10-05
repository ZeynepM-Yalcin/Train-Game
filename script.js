const trains = [];
let costDisplay = null; // Global variable to store the cost display element
const gameContainer = document.getElementById("game-container");
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
let costContainer = null; 
let gameTime = 0; // Initialize game time to 0
let stationsBought = 0; // Variable to keep track of the number of stations bought
svg.setAttribute("width", "1352");
svg.setAttribute("height", "761");
gameContainer.appendChild(svg);
const stations = [];
let drawing = false;
let startPoint = null;
let endPoint = null;
let line = null;
let ticketPrice = 1.00; // Initial ticket price
let upgradeTicketCost = 20; // Initial cost to upgrade ticket price
let currentlyClickedStation = null;


class Bank {
    constructor(initialAmount) {
        this.totalEarnings = initialAmount || 0; // Ensure initial amount is a valid number
    }
    addEarnings(amount) {
        if (!isNaN(amount)) { // Check if amount is a valid number
            this.totalEarnings += amount;
        }
    }
    getFormattedTotalEarnings() {
        return `$${this.totalEarnings.toFixed(2)}`;
    }
}
const initialBankAmount = 300; // Set the initial amount for the bank
// Create a Bank instance with the initial amount
const bank = new Bank(initialBankAmount);

class Passenger {
    constructor(currentStation, destination) {
        this.currentStation = currentStation;
        this.destination = destination;
    }
}

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
        const capacityTimerElement = document.getElementById("capacity-timer");
        let countdown = 10; // 10 seconds countdown
    
        capacityTimerElement.textContent = countdown;
    
        this.capacityTimer = setInterval(() => {
            countdown--;
            capacityTimerElement.textContent = countdown;
    
            if (countdown <= 0) {
                clearInterval(this.capacityTimer);
                capacityTimerElement.textContent = "Capacity Exceeded!";
    
                // End the game immediately
                gameOver();
            }
        }, 1000); // Update every second
    }
    
    stopCapacityTimer() {
        const capacityTimerElement = document.getElementById("capacity-timer");
        clearInterval(this.capacityTimer);
        capacityTimerElement.textContent = "";
    }
}

class Line {
    constructor(svg) {
        this.x1 = 0;
        this.y1 = 0;
        this.x2 = 0;
        this.y2 = 0;
        this.svg = svg;
        this.lineElement = this.createSVGElement();
    }

    createSVGElement() {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "line");
        line.setAttribute("stroke", "#000");
        line.setAttribute("stroke-width", "2");
        this.svg.appendChild(line);
        return line;
    }
    update() {
        this.lineElement.setAttribute("x1", this.x1);
        this.lineElement.setAttribute("y1", this.y1);
        this.lineElement.setAttribute("x2", this.x2);
        this.lineElement.setAttribute("y2", this.y2);
        // Convert the attributes to numbers
        this.x1 = parseFloat(this.x1);
        this.y1 = parseFloat(this.y1);
        this.x2 = parseFloat(this.x2);
        this.y2 = parseFloat(this.y2);
    }
}
class Train {
    constructor(id, svg, bank) {
        this.id = id;
        this.svg = svg;
        this.bank = bank; // Reference to the Bank instance
        this.trainElement = this.createTrainElement();
        this.position = { x: 0, y: 0 };
        this.animationFrameId = null;
        this.direction = 1; // 1 represents forward, -1 represents backward
        this.level = 1; // Initialize train level to 1
        this.line = line; // Store a reference to the line object
        this.capacity = 5;
        this.ticketPrice = 1.00; // Set the initial ticket price
        this.capacity = this.calculateCapacity();
    }
    
    createTrainElement() {
        const train = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        train.setAttribute("class", "train");
        train.setAttribute("r", "8");
        this.svg.appendChild(train);
        return train;
    }

    updatePosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.trainElement.setAttribute("cx", x.toString());
        this.trainElement.setAttribute("cy", y.toString());
    }
    transferPassengers(currentStation, nextStation) {
        const availablePassengersToNext = currentStation.passengers[nextStation.id] || 0;
        const transferCountToNext = Math.min(availablePassengersToNext, this.capacity);
    
        if (transferCountToNext > 0) {
            currentStation.passengers[nextStation.id] -= transferCountToNext;
            console.log(`Train ${this.id} transferred ${transferCountToNext} passengers from ${currentStation.id} to ${nextStation.id}`);
        }
    
        return transferCountToNext;
    }
    calculateUpgradeCost() {
        const baseCost = 100;
        const costMultiplier = 1.5;
        return baseCost * Math.pow(costMultiplier, this.level - 1);
    }
    
    calculateCapacity() {
        // Define the capacity for each train level
        const capacities = [50, 100, 200, 300, 500];
        // Ensure level is within valid range
        const index = Math.min(this.level - 1, capacities.length - 1);
        return capacities[index];
    }

    upgradeTrain() {
        const upgradeCost = this.calculateUpgradeCost();
        if (bank.totalEarnings >= upgradeCost) {
            bank.addEarnings(-upgradeCost);
            this.level++;
            this.capacity = this.calculateCapacity();
            updateTrainUpgradePopup(this); // Update the popup content
            updateTotalUpgradeCost();
        } else {
            alert("Insufficient funds to upgrade the train!");
        }
    }
    moveBetweenStations(startX, startY, endX, endY, speed, fromStation, toStation) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
        let progress = 0;
        let direction = 1; // 1 for forward, -1 for backward
        let waiting = false;
    
        const update = () => {
            if (!waiting) {
                const newX = startX + (deltaX / distance) * progress;
                const newY = startY + (deltaY / distance) * progress;
    
                this.updatePosition(newX, newY);
    
                progress += direction * speed;
    
                // Check if the train has reached the end station
                if (progress >= distance || progress <= 0) {
                    // Reverse the direction when reaching the end or start
                    direction *= -1;
                    waiting = true;
    
                    let nextStation;
                    if (direction === 1) {
                        nextStation = toStation;
                    } else {
                        nextStation = fromStation;
                    }
    
                    // Wait for 5 seconds at the station
                    setTimeout(() => {
                        waiting = false;
    
                        console.log(`Train ${this.id}: Transferring passengers from ${fromStation.id} to ${toStation.id}`);
                        const transferredPassengers = this.transferPassengers(fromStation, toStation);
                        console.log(`Train ${this.id}: Transferred ${transferredPassengers} passengers`);
    
                        if (transferredPassengers > 0) {
                            const earnings = this.calculateEarnings(transferredPassengers);
                            console.log(`Train ${this.id} earnings from transferring passengers: $${earnings.toFixed(2)}`);
                            this.bank.addEarnings(earnings);
                        }
    
                        console.log(`Train ${this.id}: Updating passenger counts for ${fromStation.id}`);
                        fromStation.updatePassengerCounts(stations, fromStation.basePassengerCount, {
                            [toStation.id]: transferredPassengers
                        });
    
                        console.log(`Train ${this.id}: Updating passenger information for ${fromStation.id}`);
                        updatePopupContent(fromStation.id);
    
                        // Transfer passengers in the reverse direction
                        console.log(`Train ${this.id}: Transferring passengers from ${toStation.id} to ${fromStation.id}`);
                        const reverseTransferredPassengers = this.transferPassengers(toStation, fromStation);
                        console.log(`Train ${this.id}: Transferred ${reverseTransferredPassengers} passengers`);
    
                        if (reverseTransferredPassengers > 0) {
                            const reverseEarnings = this.calculateEarnings(reverseTransferredPassengers);
                            console.log(`Train ${this.id} earnings from transferring passengers: $${reverseEarnings.toFixed(2)}`);
                            this.bank.addEarnings(reverseEarnings);
                        }
    
                        console.log(`Train ${this.id}: Updating passenger counts for ${toStation.id}`);
                        toStation.updatePassengerCounts(stations, toStation.basePassengerCount, {
                            [fromStation.id]: reverseTransferredPassengers
                        });
    
                        console.log(`Train ${this.id}: Updating passenger information for ${toStation.id}`);
                        updatePopupContent(toStation.id);
    
                        // Show the popup box
                        const popupBox = document.getElementById("popup-box");
                        popupBox.style.display = "block";
    
                        // Update the bank box
                        const bankBox = document.getElementById("bank-text");
                        if (bankBox) {
                            bankBox.textContent = `Bank: ${bank.getFormattedTotalEarnings()}`;
                        }
    
                        // Clear the cost display
                        clearCostDisplay();
                    }, 5000);
                }
            }
    
            // Request the next animation frame
            this.animationFrameId = window.requestAnimationFrame(update);
        };
    
        // Start the animation
        update();
    }
    calculateEarnings(passengerCount) {
        const currentTicketPrice = this.ticketPrice; // Retrieve the current ticket price from the train instance
        return passengerCount * currentTicketPrice;
    }
    
    
    // method to stop the train animation
    stop() {
        // Clear the animation frame
        window.cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }


}

function isOverlapping(newStation, existingStations) {
    for (const station of existingStations) {
        const distance = Math.sqrt(Math.pow(newStation.cx - station.cx, 2) + Math.pow(newStation.cy - station.cy, 2));
        if (distance < 40) { // Minimum distance of 40 (2 * radius) to prevent overlap
            return true;
        }
    }
    return false;
}
let stationCounter = 1; // Global variable to keep track of station IDs

function generateNonOverlappingStation(existingStations, level = 1) {
    let newStation;
    do {
        const cx = Math.floor(Math.random() * (svg.getAttribute("width") - 40)) + 20;
        const cy = Math.floor(Math.random() * (svg.getAttribute("height") - 40)) + 20;
        const stationId = `station${stationCounter}`; // Assign a unique ID to the station
        newStation = new Station(stationId, cx, cy, level);
        let overlapping = isOverlapping(newStation, existingStations);
        if (!overlapping) {
            stationCounter++; // Increment the station counter
            return newStation;
        }
    } while (true);
}
function buyStationUpgrade(station) {
    const upgradeCost = 100 * station.level; // Cost of upgrading based on the station's current level
    if (bank.totalEarnings >= upgradeCost) {
        // Check if the bank has enough funds
        bank.addEarnings(-upgradeCost); // Deduct upgrade cost from the bank
        station.updateLevel(station.level + 1); // Upgrade station level
        console.log(`Station ${station.id} upgraded to level ${station.level}`);
    } else {
        console.log("Insufficient funds to upgrade station.");
    }
}
function getRandomDestination(currentStation, stations) {
    // Filter out the current station from the list of stations
    const availableStations = stations.filter(station => station !== currentStation);
    // Pick a random station from the available stations
    const randomIndex = Math.floor(Math.random() * availableStations.length);
    return availableStations[randomIndex];
}

function createCountdownTimer() {
    const timerElement = document.createElement("div");
    timerElement.setAttribute("id", "countdown-timer");
    document.body.appendChild(timerElement);
    let countdown = 240; // 4 minutes in seconds
    // Update the countdown timer periodically
    const intervalId = setInterval(() => {
        const minutes = Math.floor(countdown / 60);
        const seconds = countdown % 60;
        timerElement.innerHTML = `<strong>Time Remaining:</strong> ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        countdown--;
        // Clear the interval when the countdown reaches zero
        if (countdown < 0) {
            clearInterval(intervalId);
            timerElement.style.display = "none";
        }
    }, 1000);
}
const gameTimerInterval = setInterval(() => {
    gameTime++;
    // Check if 4 minutes (240 seconds) have passed without buying a station
    if (gameTime >= 240) {
        gameOver();
        clearInterval(gameTimerInterval); // Stop the game timer
    }
}, 1000);
createCountdownTimer();
let countdownTimer;
function updatePopupContent(station) {
    const popupBox = document.getElementById("popup-box");
    if (!popupBox) return;

    if (station && station.passengers && Object.values(station.passengers).every(count => !isNaN(count)) && station.capacity) {
        const totalPassengers = Object.values(station.passengers).reduce((total, count) => total + count, 0);
        const capacity = station.capacity;
        const passengerRatio = totalPassengers / capacity;

        popupBox.innerHTML = `
            <p>${station.getPassengerInfo()}</p>
            <p>Level: ${station.level}</p>
            <p>Total: ${totalPassengers}/${capacity} (${(passengerRatio * 100).toFixed(2)}% of capacity)</p>
            <button id="upgrade-station-btn">Upgrade Station</button>
        `;

        const upgradeStationButton = document.getElementById("upgrade-station-btn");
        if (upgradeStationButton) {
            upgradeStationButton.addEventListener("click", () => {
                upgradeStation(station);
            });
        }

        // Check if total passengers exceed capacity, start capacity timer if needed
        if (totalPassengers > capacity) {
            station.startCapacityTimer();
        } else {
            station.stopCapacityTimer(); // Stop the capacity timer if capacity is no longer exceeded
        }
    } else {
        popupBox.innerHTML = "Station information not available.";
    }
}
function startCountdown() {
    let secondsLeft = 5;
    countdownTimer = setInterval(() => {
        if (secondsLeft === 0) {
            clearInterval(countdownTimer);
            // Game over, display message
            alert("Game Over! You exceeded the capacity limit.");
        } else {
            console.log(`Countdown: ${secondsLeft} seconds left`);
            secondsLeft--;
        }
    }, 1000);
}

svg.addEventListener("mousedown", startDrawing);
svg.addEventListener("mouseup", endDrawing);
svg.addEventListener("mousemove", drawLine);
// Generate initial stations
for (let i = 1; i <= 3; i++) {
    const initialLevel = 1;
    const newStation = generateNonOverlappingStation(stations, initialLevel);
    stations.push(newStation);
    const newStationElement = newStation.createSVGElement();
    svg.appendChild(newStationElement);
}
// Initialize passengers for each station
stations.forEach(station => {
    station.initializePassengers(stations);
});
function startDrawing(e) {
    if (!drawing && e.target.classList.contains("station")) {
        startPoint = e.target;
        drawing = true;
        line = new Line(svg);
        line.x1 = parseFloat(startPoint.getAttribute("cx")) || 0;
        line.y1 = parseFloat(startPoint.getAttribute("cy")) || 0;
        line.x2 = line.x1;
        line.y2 = line.y1;
        // Display passenger information in the popup box
        const currentStationId = startPoint.id;
        updatePopupContent(currentStationId);
        // Clear the cost display if it exists
        clearCostDisplay();
        // Create the cost display element
        costDisplay = document.createElement("div");
        costDisplay.setAttribute("class", "cost-display");
        svg.appendChild(costDisplay);
    }
}
function drawLine(e) {
    if (drawing && line) {
        line.x2 = e.offsetX;
        line.y2 = e.offsetY;
        line.update();
        // Calculate the cost based on the distance between stations
        const startStation = stations.find(s => s.id === startPoint.id);
        const cost = calculateLineCost(line, startStation);
        // Display the cost above the line
        displayLineCost(line, cost);
    }
}
function calculateLineCost(line, startStation, endStation) {
    const distance = Math.sqrt(Math.pow(line.x1 - line.x2, 2) + Math.pow(line.y1 - line.y2, 2));
    const costPerUnit = 0.1; // Adjust this value to control the cost sensitivity
    const cost = distance * costPerUnit;
    return cost;
}
function displayLineCost(line, cost) {
    if (!costContainer) {
        // Create the container if it doesn't exist
        costContainer = document.createElement("div");
        costContainer.setAttribute("id", "line-cost");
        document.body.appendChild(costContainer);
    }
    // Update the cost display content
    costContainer.textContent = `$${cost.toFixed(2)}`;
    // Position the container next to the line
    costContainer.style.position = "absolute";
    costContainer.style.top = (line.y1 + line.y2) / 2 + "px";
    costContainer.style.left = (line.x1 + line.x2) / 2 + "px";
}
function clearCostDisplay() {
    if (costDisplay) {
        costDisplay.classList.remove("hidden"); // Remove the "hidden" class instead of adding it
    }
}
function endDrawing(e) {
    if (drawing) {
        endPoint = e.target;
        if (startPoint !== endPoint && endPoint.classList.contains("station")) {
            // Find the start and end stations
            const startStation = stations.find(s => s.id === startPoint.id);
            const endStation = stations.find(s => s.id === endPoint.id);

            // Calculate the cost of the line
            const cost = calculateLineCost(line, startStation, endStation);

            // Check if the bank has sufficient funds
            if (bank.totalEarnings >= cost) {
                // Deduct the cost from the bank
                bank.addEarnings(-cost);

                // Update the line's endpoints to the coordinates of the stations
                line.x1 = startStation.cx;
                line.y1 = startStation.cy;
                line.x2 = endStation.cx;
                line.y2 = endStation.cy;
                line.update();

                // Create the marker element
                const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                const midX = (line.x1 + line.x2) / 2;
                const midY = (line.y1 + line.y2) / 2;
                marker.setAttribute("cx", midX);
                marker.setAttribute("cy", midY);
                marker.setAttribute("r", "5");
                marker.setAttribute("class", "line-marker");
                svg.appendChild(marker);

                // Initialize a new train for the current line
                const trainId = `train${trains.length + 1}`; // Generate a unique identifier for the train
                const train = new Train(trainId, svg, bank);
                train.line = line; // Assign the line to the train
                trains.push(train); // Add the new train instance to the trains array
                updateTotalUpgradeCost();

                // Add click event listener to the marker
                marker.addEventListener("click", function() {
                    showTrainUpgradePopup(train);
                });

                const passengerCount = 50; // Define the passenger count here
                train.moveBetweenStations(
                    startStation.cx,
                    startStation.cy,
                    endStation.cx,
                    endStation.cy,
                    2,
                    startStation,
                    endStation,
                    passengerCount,
                    () => {
                        // Update passenger information in the popup box for the end station
                        const endStationId = endStation.id;
                        updatePopupContent(endStation);
                        // Show the popup box
                        const popupBox = document.getElementById("popup-box");
                        popupBox.style.display = "block";
                        // Update the bank box
                        const bankBox = document.getElementById("bank-text");
                        if (bankBox) {
                            bankBox.textContent = `Bank: ${bank.getFormattedTotalEarnings()}`;
                        }
                        // Clear the cost display
                        clearCostDisplay();
                    }
                );

                // Display the cost in the line cost box
                displayLineCost(line, cost);
            } else {
                // Remove the line if there are insufficient funds
                if (line && line.lineElement && line.lineElement.parentNode === svg) {
                    svg.removeChild(line.lineElement);
                }
                alert("Insufficient funds to create the line!");
            }
        } else {
            // Remove the line if it starts and ends at the same station or doesn't end on a station
            if (line && line.lineElement && line.lineElement.parentNode === svg) {
                svg.removeChild(line.lineElement);
            }
            // Clear the cost display
            clearCostDisplay();
        }
        drawing = false;
        line = null;
    }
}
// Update passenger counts and log information every second
const passengerUpdateInterval = setInterval(() => {
    stations.forEach(station => {
        station.updatePassengerCounts(stations);
    // Update the bank box
    const bankBox = document.getElementById("bank-text");
    if (bankBox) {
        bankBox.textContent = `Bank: ${bank.getFormattedTotalEarnings()}`;
    }
}, 1000);
});
let countdownTimerInterval;
let countdown = 240; // 4 minutes in seconds
let timerElement;

function startCountdownTimer() {
    timerElement = document.getElementById("countdown-timer");

    countdownTimerInterval = setInterval(() => {
        const minutes = Math.floor(countdown / 60);
        const seconds = countdown % 60;
        timerElement.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

        countdown--;

        if (countdown < 0) {
            clearInterval(countdownTimerInterval);
            timerElement.style.display = "none";
            gameOver();
        }
    }, 1000);
}

function resetCountdownTimer() {
    clearInterval(countdownTimerInterval);
    countdown = 240;
    timerElement.textContent = formatCountdownTime(countdown);
}

function buyStation() {
    const stationCost = 5;
    if (bank.totalEarnings >= stationCost) {
        bank.addEarnings(-stationCost);
        const newStation = generateNonOverlappingStation(stations, 1);
        stations.push(newStation);
        const newStationElement = newStation.createSVGElement();
        svg.appendChild(newStationElement);

        newStation.initializePassengers(stations);
        updatePopupContent(newStation);

        stations.forEach(station => {
            station.updatePassengerCounts(stations);
        });

        const bankBox = document.getElementById("bank-text");
        if (bankBox) {
            bankBox.textContent = `Bank: ${bank.getFormattedTotalEarnings()}`;
        }

        stationsBought++;
        if (stationsBought >= 15) {
            endGame("You have reached the maximum number of stations (15).");
        }

        gameTime = 0;

        // Reset the countdown timer
        resetCountdownTimer();
    } else {
        alert("Insufficient funds to buy a station!");
    }
}

// Start the countdown timer when the game starts
startCountdownTimer();

function formatCountdownTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `Time Remaining: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
function gameOver() {
    // Stop train movements
    trains.forEach(train => train.stop());

    // Display game over message or take other actions
    alert("Game Over! You exceeded the station capacity and didn't upgrade in time.");

    // Reset game time for the next round
    gameTime = 0;
}
function calculateUpgradeCost(station) {
    // Define the base upgrade cost and the cost multiplier
    const baseCost = 100; // Base upgrade cost
    const costMultiplier = 1.5; // Cost multiplier for each level increase
    // Calculate the upgrade cost based on the station's current level
    const upgradeCost = baseCost * Math.pow(costMultiplier, station.level - 1);
    return upgradeCost;
}
function upgradeStation(station) {
    const upgradeCost = calculateUpgradeCost(station);
    console.log("Upgrade Cost:", upgradeCost); // Debugging: Output the upgrade cost
    console.log("Bank Balance:", bank.getFormattedTotalEarnings()); // Debugging: Output the bank balance
    if (bank.totalEarnings >= upgradeCost) {
        // Deduct the upgrade cost from the bank
        bank.addEarnings(-upgradeCost);
        // Increase the station level
        station.updateLevel(station.level + 1);
        // Update the popup content to reflect the changes
        updatePopupContent(station);
        // Update the bank box
        const bankBox = document.getElementById("bank-text");
        if (bankBox) {
            bankBox.textContent = `Bank: ${bank.getFormattedTotalEarnings()}`;
        }
        console.log(`Station ${station.id} upgraded to level ${station.level}`);
    } else {
        alert("Insufficient funds to upgrade the station!");
    }
}
function getStationCapacity(level) {
    // Define the capacity for each station level
    const capacities = [100, 200, 350, 500, 1000];
    // Ensure level is within valid range
    const index = Math.min(level - 1, capacities.length - 1);
    return capacities[index];
}
document.addEventListener("DOMContentLoaded", () => {
    const buyStationButton = document.getElementById("buy-station-btn");
    buyStationButton.addEventListener("click", buyStation);

    // Select all upgrade station buttons
    const upgradeStationButtons = document.querySelectorAll(".upgrade-station-btn");

    // Add event listeners to each upgrade station button
    upgradeStationButtons.forEach(button => {
        button.addEventListener("click", function() {
            const stationId = this.getAttribute("data-station-id");
            const station = stations.find(station => station.id === stationId);
            upgradeStation(station);
        });
    });

    // Add event listener for the upgrade ticket price button
    const upgradeTicketPriceBtn = document.getElementById('upgrade-ticket-price-btn');
    upgradeTicketPriceBtn.addEventListener('click', upgradeTicketPrice);
});

// Function to upgrade station level
function upgradeStationWithLevel(stationId, newLevel) {
    const station = stations.find(s => s.id === stationId);
    if (station) {
        // Call upgradeStation function with the station instance
        upgradeStation(station);
    } else {
        console.log(`Station with ID ${stationId} not found.`);
    }
}

function upgradeTicketPrice() {
    const bankAmount = bank.totalEarnings; // Get the current bank amount

    // Check if there are sufficient funds in the bank to upgrade
    if (bankAmount >= upgradeTicketCost) {
        // Increase ticket price by $0.10
        ticketPrice += 0.10;

        // Increase upgrade cost by $2 for the next upgrade
        upgradeTicketCost += 2;

        // Deduct upgrade cost from the bank
        bank.addEarnings(-upgradeTicketCost);

        // Update ticket price display
        updateTicketPrice();

        // Update bank display
        const bankText = document.getElementById('bank-text');
        bankText.textContent = `Bank: ${bank.getFormattedTotalEarnings()}`;

        // Update ticket price for all Train instances
        trains.forEach(train => {
            train.ticketPrice = ticketPrice;
        });
    } else {
        alert('Insufficient funds to upgrade the ticket price!');
    }
}

function updateTicketPrice() {
    const ticketPriceDisplay = document.getElementById('ticket-price');
    if (ticketPriceDisplay) {
        ticketPriceDisplay.textContent = ticketPrice.toFixed(2);
    } else {
        console.log('Ticket price display element not found.');
    }
}

// Function to show the train upgrade popup
function showTrainUpgradePopup(train) {
    const popupContent = document.getElementById("train-upgrade-popup-content");
    popupContent.innerHTML = `
        <h3>Upgrade Train</h3>
        <p>Current Level: ${train.level}</p>
        <p>Capacity: ${train.capacity}</p>
        <button id="upgrade-train-btn">Upgrade</button>
    `;

    const upgradeTrainButton = document.getElementById("upgrade-train-btn");
    upgradeTrainButton.addEventListener("click", function() {
        const upgradeCost = train.calculateUpgradeCost();
        if (bank.totalEarnings >= upgradeCost) {
            bank.addEarnings(-upgradeCost);
            train.upgradeTrain();
            updateTrainUpgradePopup(train);
            // Update the bank box
            const bankBox = document.getElementById("bank-text");
            if (bankBox) {
                bankBox.textContent = `Bank: ${bank.getFormattedTotalEarnings()}`;
            }
        } else {
            alert("Insufficient funds to upgrade the train!");
        }
    });

    const popup = document.getElementById("train-upgrade-popup");
    popup.style.display = "block";
}

function updateTrainUpgradePopup(train) {
    const popupContent = document.getElementById("train-upgrade-popup-content");
    popupContent.innerHTML = `
        <h3>Upgrade Train</h3>
        <p>Current Level: ${train.level}</p>
        <p>Capacity: ${train.capacity}</p>
        <button id="upgrade-train-btn">Upgrade</button>
    `;
}
// Upgrade all trains to the next level




function updateTotalUpgradeCost() {
    let totalUpgradeCost = 0;
    let upgradeableTrains = trains.filter(train => train.level < 5);

    upgradeableTrains.forEach(train => {
        totalUpgradeCost += train.calculateUpgradeCost();
    });

 
}
document.addEventListener("click", function(e) {
    if (e.target.classList.contains("station")) {
        const currentStation = stations.find(s => s.id === e.target.id);
        if (currentStation) {
            const popupBox = document.getElementById("popup-box");
            if (popupBox) {
                popupBox.style.display = "block";
                updatePopupContent(currentStation);

                const windowClickHandler = (clickEvent) => {
                    if (!popupBox.contains(clickEvent.target) && clickEvent.target !== e.target) {
                        popupBox.style.display = "none";
                        window.removeEventListener("click", windowClickHandler);
                    }
                };
                window.addEventListener("click", windowClickHandler, { once: true });
            }
        } else {
            console.log("Station not found.");
        }
    } else if (e.target.classList.contains("line")) {
        showTrainUpgradePopup();
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const buyStationButton = document.getElementById("buy-station-btn");
    buyStationButton.addEventListener("click", buyStation);

    // Select all upgrade station buttons
    const upgradeStationButtons = document.querySelectorAll(".upgrade-station-btn");

    // Add event listeners to each upgrade station button
    upgradeStationButtons.forEach(button => {
        button.addEventListener("click", function() {
            const stationId = this.getAttribute("data-station-id");
            const station = stations.find(station => station.id === stationId);
            upgradeStation(station);
        });
    });

    // Add event listener for the upgrade ticket price button
    const upgradeTicketPriceBtn = document.getElementById('upgrade-ticket-price-btn');
    upgradeTicketPriceBtn.addEventListener('click', upgradeTicketPrice);

 
});
// Call initializePassengers for each station to trigger passenger generation
stations.forEach(station => {
    station.initializePassengers(stations);
});

// Monitor passenger counts periodically
const monitorPassengerCounts = setInterval(() => {
    // Log passenger counts for each station
    stations.forEach(station => {
        console.log(`Passenger count at ${station.id}:`, station.passengers);
    });
}, 5000); // Log counts every 5 seconds
svg.addEventListener("click", function(e) {
    if (e.target.classList.contains("line-marker")) {
        const clickedMarker = e.target;
        const clickedLine = clickedMarker.parentNode;
        const trainOnLine = trains.find(train => train.line === clickedLine);
        if (trainOnLine) {
            showTrainUpgradePopup(trainOnLine);
        }
    }
});
module.exports = { Station, gameOver, buyStation, upgradeStation, bank };