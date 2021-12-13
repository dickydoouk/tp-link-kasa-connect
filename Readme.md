# TP-Link Kasa Connect

Unofficial Node.js library for connecting to TP-Link Kasa devices. Currently supports HS100 only.

## Installation Instructions

```npm install tp-link-kasa-connect```

## Usage

### Discovery

In order to discover your devices it is advisable to login to your TP-Link account and call the listDevices function. To do this:

```ts
const cloudToken = await cloudLogin(email, password);
    
const devices = await listDevicesByType(cloudToken, 'IOT.SMARTPLUGSWITCH');
```

Once you have determined which device you wish to use. You can enquire of its current state using:

```ts
const getDeviceInfoResponse = await getDeviceInfo(deviceIp);

console.log(getDeviceInfoResponse);
```

To change the device state e.g. turn it on or off use:

```ts
await turnOn(deviceIp);
await turnOff(deviceIp);
```

