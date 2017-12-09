'use strict';

const DEFAULT_DEVICE_OPTIONS = {
};

const mergeOptions = require('merge-options');
var NetatmoDevice = require("../lib/netatmo-device");

var homebridge;
var WeatherStationAccessory;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    WeatherStationAccessory = require("../accessory/weatherstation-accessory")(homebridge);
  }

  class WeatherstationDeviceType extends NetatmoDevice {
  	constructor(log, api, i18n, config) {
      super(log, api, i18n, config);
      this.log.debug("Creating Weatherstation Devices");
      this.deviceType = "weatherstation";
      this.options = mergeOptions(DEFAULT_DEVICE_OPTIONS, this.options, this.config.weather_opts || {});
    }

    loadDeviceData(callback) {
      this.api.getStationsData(function (err, devices) {
        if(!err) {
          var deviceMap = {};
          var deviceOpts = this.config.device_opts || {};
          devices.forEach(function( device ) {
            this.log.debug("Processing device " + device._id + ", name " + device.module_name);
            deviceMap[device._id] = device;
            device.options = mergeOptions(this.options, deviceOpts[device._id] || {} );
            device._name = this.buildName(device.station_name, device.module_name, device.options);
            this.log.debug("Configured device " + device._name + ": %j", device.options);
            if (device.modules) {
              device.modules.forEach(function( module ) {
                this.log.debug("Processing module " + module._id + ", name " + module.module_name);
                module.options = mergeOptions(this.options, deviceOpts[module._id] || {} );
                module._name = this.buildName(device.station_name, module.module_name, module.options);
                this.log.debug("Configured module " + module._name + ": %j", module.options);
                deviceMap[module._id] = module;
              }.bind(this));
            }
          }.bind(this));
          this.cache.set(this.deviceType, deviceMap);
          this.deviceData = deviceMap;
        }
        callback(err, this.deviceData);
      }.bind(this));
    }

    buildAccessory(deviceData) {
      return new WeatherStationAccessory(deviceData, this);
    }
  }
  
  return WeatherstationDeviceType;

};
  