class Bank {
    constructor(initialAmount) {
        this.totalEarnings = initialAmount;
    }

    addEarnings(amount) {
        this.totalEarnings += amount;
    }

    getFormattedTotalEarnings() {
        return `$${this.totalEarnings.toFixed(2)}`;
    }
}