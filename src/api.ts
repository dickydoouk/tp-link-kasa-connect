import axios from 'axios';
import net from 'net';
import { KasaDevice } from "./types";
import { resolveMacToIp } from './network-tools';
import PromiseSocket from "promise-socket"
import { encryptWithHeader, decryptWithHeader } from "tplink-smarthome-crypto"

const baseUrl = 'https://eu-wap.tplinkcloud.com/'

// Cloud Functions

export const cloudLogin = async (email: string, password: string): Promise<string> => {
  const loginRequest = {
    "method": "login",
    "params": {
      "appType": "Tapo_Android",
      "cloudPassword": password,
      "cloudUserName": email,
      "terminalUUID": "59284a9c-e7b1-40f9-8ecd-b9e70c90d19b"
    }
  }
  const response = await axios({
    method: 'post',
    url: baseUrl,
    data: loginRequest
  })

  checkError(response.data);

  return response.data.result.token;
}

export const listDevices = async (cloudToken: string): Promise<Array<KasaDevice>> => {
  const getDeviceRequest = {
    "method": "getDeviceList",
  }
  const response = await axios({
    method: 'post',
    url: `${baseUrl}?token=${cloudToken}`,
    data: getDeviceRequest
  })

  checkError(response.data);

  return Promise.all(response.data.result.deviceList);
}

export const listDevicesByType = async (cloudToken: string, deviceType: string): Promise<Array<KasaDevice>> => {
  const devices = await listDevices(cloudToken);
  return devices.filter(d => d.deviceType === deviceType);
}

// Device Functions

export const turnOn = async (deviceIp: string, deviceOn: boolean = true) => {
    const turnDeviceOnRequest = {
      system: {
        set_relay_state: {
          state: deviceOn?1:0
        }
      }
    }
    return await sendPayloadToDevice(deviceIp, turnDeviceOnRequest);
  }

  export const turnOff = async (deviceIp: string) => {
    return turnOn(deviceIp, false);
  }

  export const turnLedOn = async (deviceIp: string, ledOn: boolean = true) => {
    const turnDeviceOnRequest = {
      system: {
        set_led_off: {
          off: ledOn?0:1
        }
      }
    }
    return await sendPayloadToDevice(deviceIp, turnDeviceOnRequest);
  }

  export const turnLedOff = async (deviceIp: string) => {
    return turnLedOn(deviceIp, false);
  }

  export const setBrightness = async (deviceIp: string, brightnessLevel: number = 100) => {
    const setBrightnessRequest = {
      "smartlife.iot.dimmer": {
        set_brightness: {
          brightness: brightnessLevel
        }
      }
    }
    await sendPayloadToDevice(deviceIp, setBrightnessRequest)
  }

  export const getDeviceInfo = async (deviceIp: string): Promise<string | Buffer> => {
    const getDeviceInfoRequest = { 
      system:{ 
        get_sysinfo:null 
      } 
    }
    const getDeviceInfoResponse = await sendPayloadToDevice(deviceIp, getDeviceInfoRequest);
    return getDeviceInfoResponse.system["get_sysinfo"];
  }

  const sendPayloadToDevice = async (deviceIp: string, payload: any) => {
    const socket = new net.Socket()
    const client = new PromiseSocket(socket)
    await client.connect(9999, deviceIp)
    await client.writeAll(encryptWithHeader(Buffer.from(JSON.stringify(payload))));
    const response = await client.readAll() as Buffer
    const decryptedResponse = JSON.parse(decryptWithHeader(response).toString())
    checkDeviceError(decryptedResponse);
    return decryptedResponse;
  }

export const isKasaDevice = (deviceType: string) => {
  switch (deviceType) {
    case 'IOT.SMARTPLUGSWITCH':
      //TODO some more probably here
    return true
    default: return false
  }
}

const checkDeviceError = (responseData: any) => {
  console.log(responseData)
  const systemResponse = Object.values(responseData)[0];
  const errorCode = systemResponse["err_code"];
  if (errorCode) {
    const errorMessage = systemResponse["err_msg"];
    switch (errorCode) {
      case 0: return;
      default: throw new Error(`Unexpected Error Code: ${errorCode}: ${errorMessage}`);
    }
  }
}


const checkError = (responseData: any) => {
  const errorCode = responseData["error_code"];
  if (errorCode) {
    switch (errorCode) {
      case 0: return;
      case -1010: throw new Error("Invalid public key length");
      case -1501: throw new Error("Invalid request or credentials");
      case -1002: throw new Error("Incorrect request");
      case -1003: throw new Error("JSON format error");
      case -20601: throw new Error("Incorrect cloud email or password");
      case -20661: throw new Error("Incorrect device email or password");
      case -20675: throw new Error("Cloud token expired or invalid");
      case 9999: throw new Error("Device token expired or invalid");
      default: throw new Error(`Unexpected Error Code: ${errorCode}`);
    }
    
  }
}

export const base64Encode = (data: string) : string => {
  return Buffer.from(data).toString('base64');
}

export const base64Decode = (data: string) : string => {
  return Buffer.from(data, 'base64').toString();
}