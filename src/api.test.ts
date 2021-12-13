import { cloudLogin, listDevices, listDevicesByType, turnOn,turnLedOn,turnLedOff, turnOff, setBrightness, getDeviceInfo } from './api';

const email = "<TP LINK ACCOUNT EMAIL>";
const password = "<TP LINK ACCOUNT PASSWORD>";
const deviceIp = "192.168.0.46";

xtest('Login & list devices', async () => {
    const cloudToken = await cloudLogin(email, password);
    
    const devices = await listDevices(cloudToken);
    console.log(devices);
});

xtest('Get device status', async () => {
    const getDeviceInfoResponse = await getDeviceInfo(deviceIp);
    console.log(getDeviceInfoResponse);
});

xtest('Turn device on', async () => {
    const turnOnResponse = await turnOn(deviceIp);
    console.log(turnOnResponse)
});

xtest('Turn device off', async () => {
    const turnOffResponse = await turnOn(deviceIp);
    console.log(turnOffResponse)
});