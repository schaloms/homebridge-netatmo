'use strict';

const DEFAULT_DEVICE_OPTIONS = {
};

const mergeOptions = require('merge-options');
var NetatmoDevice = require("../lib/netatmo-device");

var homebridge;
var ThermostatAccessory;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    ThermostatAccessory = require("../accessory/thermostat-accessory")(homebridge);
  }

  class ThermostatDeviceType extends NetatmoDevice {
    constructor(log, api, config) {
      super(log, api, config);
      this.deviceType = "thermostat";
      this.options = mergeOptions(this.options, DEFAULT_DEVICE_OPTIONS, this.config[this.deviceType] || {});
    }

    loadDeviceData(callback) {
      this.api.getThermostatsData(function (err, devices) {
        if(!err) {
          var deviceMap = {};
          devices.forEach(function( device ) {
            deviceMap[device._id] = device;
          }.bind(this));
          this.cache.set(this.deviceType, deviceMap);
          this.deviceData = deviceMap;
        }
        callback(err, this.deviceData);
      }.bind(this));
    }

    buildAccessory(deviceData) {
      return new ThermostatAccessory(deviceData, this);
    }

  }

  return ThermostatDeviceType;

};
