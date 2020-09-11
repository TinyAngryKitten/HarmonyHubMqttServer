const HarmonyHub = require('harmonyhub-api').HarmonyHub;
const HUB_HOST = '10.0.0.99';
const HUB_REMOTE_ID = '16676977';
const hub = new HarmonyHub(HUB_HOST, HUB_REMOTE_ID);
const mqtt = require('mqtt');
const mqttClient  = mqtt.connect('mqtt://10.0.0.96:1883', {
    reconnectPeriod: 10000,
});
//                harmony / hub placement / device (command are given as message payload)
const commandTopic = "harmony/livingroom/+";

var devices;
var activities;

initHub();

//keep connection alive
setInterval(function() {
    hub.ping().catch(() => initHub());
}, 50000);

//update device and activity definitions every hour
setInterval(async function() {
    devices = await hub.getDevices();
    activities = await hub.getActivities();
}, 60*60*1000);


mqttClient.on('connect', function () {
    mqttClient.subscribe(commandTopic, function (err) {
        if (err) console.log("Unable to subscribe to topics");
        else console.log("Connected and subscribed");
    });
});

//MQTT Events
mqttClient.on('message', function (topic, message) {
    console.log("Received message on topic"+topic+", command: "+message.toString());
    const deviceName = topic.split("/")[2];

    sendCommand(deviceName,message.toString());
});

mqttClient.on('error', (error) => console.log("Mqtt client error: "+error));
mqttClient.on('disconnect', () => console.log("Mqtt client disconnected"));
mqttClient.on('reconnect', () => console.log("Mqtt client reconnected"));
mqttClient.on('offline', () => console.log("Mqtt client is offline"));


function sendCommand(deviceName, command) {
    devices.forEach(device => {
                if(device.label === deviceName) {
                    hub.holdCommand(
                        command,
                        device.id,
                        10
                    );
                    console.log("Command sent");
                }
            });

}

function initHub() {
    console.log("Initializing hub");
    hub.connect()
        .then((config) => {
            console.log('Connected to the hub');

            console.log('\nActivities\n==========');
            config.activity.forEach(activity => {
                console.log(`${activity.label} (${activity.id})`);
            });

            console.log('\nDevices\n========');
            config.device.forEach(device => {
                console.log(`${device.label} (${device.id})`);
            });

            devices = config.device;
            activities = config.activity;
        });

    hub.on('close', () => {
        console.log("hub closed the connection");
    });
}