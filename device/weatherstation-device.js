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
  	constructor(log, api, config) {
      super(log, api, config);
      this.log.debug("Creating Weatherstation Devices");
      this.deviceType = "weatherstation";
      this.options = mergeOptions(this.options, DEFAULT_DEVICE_OPTIONS, this.config[this.deviceType] || {});
    }

    loadDeviceData(callback) {
      this.api.getStationsData(function (err, devices) {
        if(!err) {
          var deviceMap = {};
          devices.forEach(function( device ) {
            deviceMap[device._id] = device;
            device.options = mergeOptions(this.options, this.options[device._id] || {} );
            device._name = this.buildName(device.station_name, device.module_name, device.options);
            if (device.modules) {
              device.modules.forEach(function( module ) {
                module.options = mergeOptions(device.options, device.options[module._id] || {} );
                module._name = this.buildName(device.station_name, module.module_name, module.options);
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

    buildName(stationName, moduleName, opts) {
      if (opts.naming_strategy === 'module') {
        return moduleName;
      } else if ((opts.naming_strategy === 'custom' || typeof opts.naming_strategy === 'undefined') && typeof opts.name === 'string' ) {
        return opts.name;
      }
      return stationName + " " + moduleName;
    }
  }
  
  return WeatherstationDeviceType;

};
  