class Train {
    constructor(id, svg, bank, line) {
        this.id = id;
        this.svg = svg;
        this.bank = bank; // Reference to the Bank instance
        this.trainElement = svg ? this.createTrainElement() : null;
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
        if (this.bank.totalEarnings >= upgradeCost) {
          this.bank.addEarnings(-upgradeCost);
          this.level++;
          this.capacity = this.calculateCapacity();
          // Perform any additional actions after upgrading the train
        } else {
          // Handle insufficient funds scenario
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
        
                    // Transfer passengers from the current station to the next station
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
        
                    // Transfer passengers from the next station back to the current station
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
                        bankBox.textContent = `Bank: ${this.bank.getFormattedTotalEarnings()}`;
                    }
        
                    // Clear the cost display
                    clearCostDisplay();
        
                    // Wait for 5 seconds at the station
                    setTimeout(() => {
                        waiting = false;
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
function updateTotalUpgradeCost() {
    let totalUpgradeCost = 0;
    let upgradeableTrains = trains.filter(train => train.level < 5);

    upgradeableTrains.forEach(train => {
        totalUpgradeCost += train.calculateUpgradeCost();
    });

    return totalUpgradeCost;
}

module.exports = {Train, updateTotalUpgradeCost};