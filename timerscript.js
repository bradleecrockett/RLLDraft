let timerInterval;

function startTimer() {
    let timerDuration = 60; // seconds
    let timeRemaining = timerDuration;

    // Update the timer display every second
    timerInterval = setInterval(() => {
        const timerElement = document.getElementById('timer');
        timerElement.textContent = `Time Remaining: ${timeRemaining}s`;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            handleTimerExpiry();
        } else {
            timeRemaining--;
        }
    }, 1000);
}

function handleTimerExpiry() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = "Time's up!";
    timerElement.style.color = "red"; // Change the text color to red
    alert("Time's up! Skipping to the next coach.");
    // Add logic to skip the coach's turn here
}

// Attach event listener to the "Load players" button
document.getElementById('loadBtn').addEventListener('click', () => {
    // Logic to load players goes here
    console.log("Players loaded! Starting the timer...");
    startTimer(); // Start the timer after players are loaded
});