//GAME STATE
const stations = [];
const trains = [];
let drawing = false;
let startPoint = null;
let line = null;
let ticketPrice = 1.00;
let upgradeTicketCost = 20;
let gameTime = 0;
let stationCounter = 1;

let svg = null;
let bank = null;

//BANK CLASS
function Bank(initialAmount) {
    this.totalEarnings = initialAmount;
    
    this.addEarnings = function(amount) {
        if (!isNaN(amount)) {
            this.totalEarnings += amount;
        }
    };
    
    this.getFormattedTotal = function() {
        return `$${this.totalEarnings.toFixed(2)}`;
    };
}

//STATION CLASS
function Station(id, cx, cy, level) {
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.level = level;
    this.passengers = {};
    this.element = null;
    this.basePassengerCount = 0.1; // starting passenger generation rate
    this.passengerMultiplier = 1.1; // exponential growth multiplier
    this.currentPassengerRate = this.basePassengerCount;
    
    const self = this;
    
    //get capacity based on level
    this.getCapacity = function() {
        const capacities = [50, 100, 250, 500, 1000];
        return capacities[Math.min(this.level - 1, capacities.length - 1)];
    };
    
    this.capacity = this.getCapacity();
    
    //update station level
    this.updateLevel = function(newLevel) {
        this.level = newLevel;
        this.capacity = this.getCapacity();
    };
    
    //create SVG circle element
    this.createSVGElement = function() {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("id", this.id);
        circle.setAttribute("class", "station");
        circle.setAttribute("cx", this.cx);
        circle.setAttribute("cy", this.cy);
        circle.setAttribute("r", "20");
        
        circle.addEventListener("click", function() {
            updateStationPopup(self);
        });
        
        this.element = circle;
        return circle;
    };
    
    //initialize passenger counts
    this.initializePassengers = function(allStations) {
        allStations.forEach(station => {
            if (station !== this) {
                this.passengers[station.id] = 0;
            }
        });
        
        //start generating passengers every 5 seconds with exponential growth
        this.currentPassengerRate = this.basePassengerCount;
        setInterval(() => {
            this.updatePassengerCounts(allStations);
            //exponential growth: multiply rate by 1.1 each interval
            this.currentPassengerRate *= this.passengerMultiplier;
        }, 5000);
    };
    
    //update passenger counts with exponential growth
    this.updatePassengerCounts = function(allStations, transferredPassengers = {}) {
        allStations.forEach(destinationStation => {
            if (destinationStation !== this) {
                const currentCount = this.passengers[destinationStation.id] || 0;
                
                //random factor between 1.0 and 2.0
                const randomFactor = Math.random() + 1.0;
                const adjustedRate = this.currentPassengerRate * randomFactor;
                
                let newCount = currentCount + adjustedRate;
                
                //subtract any transferred passengers
                const transferCount = transferredPassengers[destinationStation.id] || 0;
                newCount = Math.max(newCount - transferCount, 0);
                
                //cap at station capacity
                newCount = Math.min(newCount, this.capacity);
                this.passengers[destinationStation.id] = Math.round(newCount);
            }
        });
        
        //check if capacity exceeded
        const total = Object.values(this.passengers).reduce((sum, count) => sum + count, 0);
        if (total >= this.capacity) {
            this.startCapacityTimer();
        }
    };
    
    //start 10-second countdown when capacity exceeded
    this.startCapacityTimer = function() {
        let countdown = 10;
        const timerDisplay = document.getElementById("capacity-timer");
        timerDisplay.textContent = countdown;
        
        const timer = setInterval(() => {
            countdown--;
            timerDisplay.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                gameOver();
            }
        }, 1000);
    };
    
    //get passenger info for display
    this.getPassengerInfo = function() {
        let info = `<strong>${this.id} (Level ${this.level})</strong><br>`;
        const total = Object.values(this.passengers).reduce((sum, count) => sum + count, 0);
        
        for (const dest in this.passengers) {
            info += `To ${dest}: ${this.passengers[dest]} passengers<br>`;
        }
        info += `<br>Total: ${total}/${this.capacity} (${(total/this.capacity*100).toFixed(1)}%)`;
        return info;
    };
}

//TRAIN CLASS   
function Train(id, svg, bank) {
    this.id = id;
    this.svg = svg;
    this.bank = bank;
    this.level = 1;
    this.capacity = 50;
    this.ticketPrice = ticketPrice;
    this.position = { x: 0, y: 0 };
    this.animationFrameId = null;
    
    const self = this;
    
    //create train SVG element
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "train");
    circle.setAttribute("r", "8");
    this.svg.appendChild(circle);
    this.element = circle;
    
    //update train position
    this.updatePosition = function(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.element.setAttribute("cx", x);
        this.element.setAttribute("cy", y);
    };
    
    //calculate train upgrade cost
    this.getUpgradeCost = function() {
        return 100 * Math.pow(1.5, this.level - 1);
    };
    
    //upgrade train
    this.upgrade = function() {
        const cost = this.getUpgradeCost();
        if (bank.totalEarnings >= cost) {
            bank.addEarnings(-cost);
            this.level++;
            this.capacity = [50, 100, 200, 300, 500][Math.min(this.level - 1, 4)];
            updateBankDisplay();
        }
    };
    
    //transfer passengers at station
    this.transferPassengers = function(fromStation, toStation) {
        const available = fromStation.passengers[toStation.id] || 0;
        const transferred = Math.min(available, this.capacity);
        
        if (transferred > 0) {
            fromStation.passengers[toStation.id] -= transferred;
            const earnings = transferred * this.ticketPrice;
            this.bank.addEarnings(earnings);
        }
        
        return transferred;
    };
    
    //move train between two stations
    this.moveBetweenStations = function(fromStation, toStation, speed) {
        console.log(`Train ${self.id} starting movement from ${fromStation.id} to ${toStation.id}`);
        const startX = fromStation.cx;
        const startY = fromStation.cy;
        const endX = toStation.cx;
        const endY = toStation.cy;
        
        console.log(`Movement: (${startX},${startY}) -> (${endX},${endY})`);
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        console.log(`Distance: ${distance}, Speed: ${speed}`);
        
        let progress = 0;
        let direction = 1;
        let waiting = false;
        
        const animate = function() {
            if (!waiting) {
                const newX = startX + (deltaX / distance) * progress;
                const newY = startY + (deltaY / distance) * progress;
                self.updatePosition(newX, newY);
                
                progress += direction * speed;
                
                //check if reached a station
                if (progress >= distance || progress <= 0) {
                    direction *= -1;
                    waiting = true;
                    
                    const currentStation = direction === 1 ? toStation : fromStation;
                    const nextStation = direction === 1 ? fromStation : toStation;
                    
                    console.log(`Train ${self.id} reached station, waiting 5 seconds`);
                    
                    //wait 5 seconds at station
                    setTimeout(() => {
                        const transferred = self.transferPassengers(currentStation, nextStation);
                        console.log(`Train ${self.id} transferred ${transferred} passengers from ${currentStation.id} to ${nextStation.id}`);
                        console.log(`${currentStation.id} passengers to ${nextStation.id}: ${currentStation.passengers[nextStation.id]}`);
                        
                        //update the station's passenger counts accounting for transferred passengers
                        const transferredMap = {};
                        transferredMap[nextStation.id] = transferred;
                        currentStation.updatePassengerCounts(stations, transferredMap);
                        
                        updateBankDisplay();
                        waiting = false;
                    }, 5000);
                }
            }
            
            self.animationFrameId = requestAnimationFrame(animate);
        };
        
        console.log(`Starting animation for train ${self.id}`);
        animate();
    };
    
    //stop train animation
    this.stop = function() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    };
}

//LINE CLASS
function Line(svg) {
    this.svg = svg;
    this.element = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.element.setAttribute("class", "line");
    this.element.setAttribute("stroke", "#000");
    this.element.setAttribute("stroke-width", "2");
    this.svg.appendChild(this.element);
    
    this.update = function(x1, y1, x2, y2) {
        this.element.setAttribute("x1", x1);
        this.element.setAttribute("y1", y1);
        this.element.setAttribute("x2", x2);
        this.element.setAttribute("y2", y2);
    };
}

//HELPER FUNCTIONS
//check if stations overlap
function isOverlapping(newStation, existingStations) {
    return existingStations.some(station => {
        const dx = newStation.cx - station.cx;
        const dy = newStation.cy - station.cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 40;
    });
}

//generate non-overlapping station
function generateStation(existingStations, level = 1) {
    let station;
    do {
        const cx = Math.floor(Math.random() * (1352 - 40)) + 20;
        const cy = Math.floor(Math.random() * (761 - 40)) + 20;
        station = new Station(`station${stationCounter}`, cx, cy, level);
    } while (isOverlapping(station, existingStations));
    
    stationCounter++;
    return station;
}

//calculate line cost based on distance
function calculateLineCost(x1, y1, x2, y2) {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance * 0.1;
}

//update bank display
function updateBankDisplay() {
    const bankText = document.getElementById('bank-text');
    bankText.textContent = `Bank: ${bank.getFormattedTotal()}`;
}

//update station popup
function updateStationPopup(station) {
    const popup = document.getElementById("popup-box");
    popup.style.display = "block";
    popup.innerHTML = `
        ${station.getPassengerInfo()}
        <br><button onclick="upgradeStation('${station.id}')">
            Upgrade ($${calculateUpgradeCost(station)})
        </button>
    `;
}

//calculate station upgrade cost
function calculateUpgradeCost(station) {
    return 100 * Math.pow(1.5, station.level - 1);
}

//upgrade station
function upgradeStation(stationId) {
    const station = stations.find(s => s.id === stationId);
    if (!station) return;
    
    const cost = calculateUpgradeCost(station);
    if (bank.totalEarnings >= cost) {
        bank.addEarnings(-cost);
        station.updateLevel(station.level + 1);
        updateStationPopup(station);
        updateBankDisplay();
    } else {
        alert("Insufficient funds!");
    }
}

//buy new station
function buyStation() {
    const cost = 5;
    if (bank.totalEarnings >= cost) {
        bank.addEarnings(-cost);
        
        const newStation = generateStation(stations, 1);
        stations.push(newStation);
        svg.appendChild(newStation.createSVGElement());
        newStation.initializePassengers(stations);
        
        //update all stations' passenger lists
        stations.forEach(s => s.initializePassengers(stations));
        
        updateBankDisplay();
        gameTime = 0; //reset timer
    } else {
        alert("Insufficient funds!");
    }
}

//upgrade ticket price
function upgradeTicketPrice() {
    if (bank.totalEarnings >= upgradeTicketCost) {
        ticketPrice += 0.10;
        bank.addEarnings(-upgradeTicketCost);
        upgradeTicketCost += 2;
        
        //update display and all trains
        document.getElementById('ticket-price').textContent = ticketPrice.toFixed(2);
        trains.forEach(train => train.ticketPrice = ticketPrice);
        updateBankDisplay();
    } else {
        alert("Insufficient funds!");
    }
}

//game over
function gameOver() {
    trains.forEach(train => train.stop());
    alert("Game Over! Station capacity exceeded.");
    gameTime = 0;
}

//LINE DRAWING
function startDrawing(e) {
    console.log("startDrawing called", e.target);
    if (e.target.classList.contains("station")) {
        console.log("Starting to draw from station:", e.target.id);
        drawing = true;
        startPoint = e.target;
        line = new Line(svg);
        
        const cx = parseFloat(startPoint.getAttribute("cx"));
        const cy = parseFloat(startPoint.getAttribute("cy"));
        console.log("Start point:", cx, cy);
        line.update(cx, cy, cx, cy);
    }
}

function drawLine(e) {
    if (drawing && line) {
        const startCx = parseFloat(startPoint.getAttribute("cx"));
        const startCy = parseFloat(startPoint.getAttribute("cy"));
        line.update(startCx, startCy, e.offsetX, e.offsetY);
    }
}

function endDrawing(e) {
    console.log("endDrawing called", e.target);
    if (!drawing) return;
    
    drawing = false;
    
    //get mouse position relative to SVG
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    console.log("Mouse position:", mouseX, mouseY);
    
    //find which station hovering over
    let endStation = null;
    for (const station of stations) {
        const dx = mouseX - station.cx;
        const dy = mouseY - station.cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= 20) { //station radius
            endStation = station;
            console.log("Found end station:", station.id);
            break;
        }
    }
    
    const startStation = stations.find(s => s.id === startPoint.id);
    
    if (endStation && endStation !== startStation) {
        console.log("Valid station target");
        console.log("Start station:", startStation);
        console.log("End station:", endStation);
        
        const cost = calculateLineCost(startStation.cx, startStation.cy, endStation.cx, endStation.cy);
        console.log("Line cost:", cost);
        console.log("Current bank balance:", bank.totalEarnings);
        
        if (bank.totalEarnings >= cost) {
            console.log("Sufficient funds! Creating line and train");
            bank.addEarnings(-cost);
            console.log("New bank balance:", bank.totalEarnings);
            
            //finalize line
            line.update(startStation.cx, startStation.cy, endStation.cx, endStation.cy);
            
            //create train marker
            const midX = (startStation.cx + endStation.cx) / 2;
            const midY = (startStation.cy + endStation.cy) / 2;
            const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            marker.setAttribute("cx", midX);
            marker.setAttribute("cy", midY);
            marker.setAttribute("r", "5");
            marker.setAttribute("class", "line-marker");
            svg.appendChild(marker);
            
            //create train
            const train = new Train(`train${trains.length + 1}`, svg, bank);
            console.log("Train created:", train);
            trains.push(train);
            train.moveBetweenStations(startStation, endStation, 2);
            
            updateBankDisplay();
        } else {
            console.log("Insufficient funds!");
            svg.removeChild(line.element);
            alert("Insufficient funds!");
        }
    } else {
        console.log("Invalid target or same station");
        if (line && line.element) {
            svg.removeChild(line.element);
        }
    }
    
    line = null;
    startPoint = null;
}

//EVENT LISTENERS
document.addEventListener("DOMContentLoaded", () => {
    //initialize SVG and Bank
    svg = document.getElementById("game-container");
    bank = new Bank(300);
    
    //initialize 3 starting stations
    for (let i = 0; i < 3; i++) {
        const station = generateStation(stations, 1);
        stations.push(station);
        svg.appendChild(station.createSVGElement());
    }
    
    //initialize passengers for all stations
    stations.forEach(s => s.initializePassengers(stations));
    
    //button listeners
    document.getElementById("buy-station-btn").addEventListener("click", buyStation);
    document.getElementById("upgrade-ticket-price-btn").addEventListener("click", upgradeTicketPrice);
    
    //drawing listeners
    svg.addEventListener("mousedown", startDrawing);
    svg.addEventListener("mousemove", drawLine);
    svg.addEventListener("mouseup", endDrawing);
    
    //game timer (4 minutes without buying station = game over)
    setInterval(() => {
        gameTime++;
        if (gameTime >= 240) {
            gameOver();
        }
    }, 1000);
});
