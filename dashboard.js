// --- Configuration (Verify Host/Port/Credentials) ---
var hostname = "c401a8412f77447a8ad1456fbf53d6e1.s1.eu.hivemq.cloud";
var port = 8884; // Secured WebSocket Port from HiveMQ Console
var clientId = "WebClient-" + parseInt(Math.random() * 10000, 10); 
var username = "migol";
var password = "Trialxtreme3"; 

// --- MQTT Topics (MUST match ESP32 code exactly) ---
const GROUP_ID = "GROUP_MIGOL"; 
const DATA_TOPIC = "esp32/weather/data/" + GROUP_ID;
const LED_CONTROL_TOPIC = "esp32/control/led/" + GROUP_ID;
const BUZZER_CONTROL_TOPIC = "esp32/control/buzzer/" + GROUP_ID;

// Initialize MQTT Client
var client = new Paho.MQTT.Client(hostname, Number(port), "/mqtt", clientId);

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
client.connect({ onSuccess: onConnect, useSSL: true, userName: username, password: password }); 

var ledState = false; 

// ---------------- CONNECTION HANDLERS ----------------

function onConnect() {
    console.log("MQTT Connected successfully.");
    document.getElementById("status-msg").innerText = "MQTT Status: Connected";
    client.subscribe(DATA_TOPIC);
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.error("Connection Lost: " + responseObject.errorMessage);
        document.getElementById("status-msg").innerText = "MQTT Status: Lost! Check Network/Credentials.";
    }
}

// ---------------- DATA HANDLER (Subscription) ----------------

function onMessageArrived(message) {
    if (message.destinationName === DATA_TOPIC) {
        try {
            var data = JSON.parse(message.payloadString);
            
            // Update all sensor readings
            document.getElementById("temp-val").innerText = data.temp ? data.temp.toFixed(1) : '--';
            document.getElementById("hum-val").innerText = data.hum ? data.hum.toFixed(1) : '--';
            document.getElementById("pres-val").innerText = data.pressure ? data.pressure.toFixed(1) : '--';
            document.getElementById("light-val").innerText = data.light; 
            document.getElementById("wind-val").innerText = data.wind ? data.wind.toFixed(2) : '--';
            document.getElementById("rain-val").innerText = data.rain ? data.rain.toFixed(2) : '--';
            
            // --- NEW: Update Wind Direction ---
            document.getElementById("dir-val").innerText = data.dir || 'N/A';
            
        } catch (e) {
            console.error("Error parsing JSON payload:", e);
        }
    }
}

// ---------------- COMMAND PUBLISHERS (Control) ----------------

function publishCommand(topic, payload) {
    if (!client.isConnected()) {
        alert("Cannot send command: Not connected to MQTT Broker.");
        return;
    }
    var message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    client.send(message);
    console.log(`Published to ${topic}: ${payload}`);
}

function toggleLED() {
    ledState = !ledState;
    var command = ledState ? "ON" : "OFF";
    var button = document.getElementById("led-button");

    publishCommand(LED_CONTROL_TOPIC, command);
    
    if (ledState) {
        button.innerText = "Turn OFF";
        button.classList.remove("btn-warning");
        button.classList.add("btn-success");
    } else {
        button.innerText = "Turn ON";
        button.classList.remove("btn-success");
        button.classList.add("btn-warning");
    }
}

function sendBuzzerCommand(command) {
    publishCommand(BUZZER_CONTROL_TOPIC, command);
}