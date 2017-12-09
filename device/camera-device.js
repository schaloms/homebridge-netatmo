'use strict';

const DEFAULT_DEVICE_OPTIONS = {
};

const mergeOptions = require('merge-options');
var NetatmoDevice = require("../lib/netatmo-device");

var homebridge;
var CameraAccessory;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    CameraAccessory = require("../accessory/camera-accessory")(homebridge);
  }

  class CameraDeviceType extends NetatmoDevice {
    constructor(log, api, i18n, config) {
      super(log, api, i18n, config);
      this.deviceType = "camera";
      this.options = mergeOptions(DEFAULT_DEVICE_OPTIONS, this.options, this.config.camera_opts || {});
    }

    loadDeviceData(callback) {
      this.api.getHomeData(function (err, homeData) {
        if(!err) {
          var deviceMap = {};
          var deviceOpts = this.config.device_opts || {};
          homeData.homes.forEach(function( home ) {
            this.log.debug("Processing device " + home.id + ", name " + home.name);
            home.options = mergeOptions(this.options, deviceOpts[home.id] || {} );
            home._name = this.buildName(home.station_name, home.name, home.options);
            this.log.debug("Configured device " + home._name + ": %j", home.options);
            deviceMap[home.id] = home;
          }.bind(this));
          this.cache.set(this.deviceType, deviceMap);
          this.deviceData = deviceMap;
        }
        callback(err, this.deviceData);
      }.bind(this));
    }

    buildAccessory(deviceData) {
      return new CameraAccessory(deviceData, this);
    }

  }

  return CameraDeviceType;

};