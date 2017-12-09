'use strict';

const DEFAULT_CONFIG = {
  naming_strategy: "default",
  ttl: 10, // 10 seconds caching - use config["ttl"] to override
  refresh_check: 15 * 60 * 1000, // 15 minutes
  refresh_run: 20 * 1000 // 20 seconds
};

var NodeCache = require("node-cache");
const mergeOptions = require('merge-options');

class NetatmoDevice {
  constructor(log, api, i18n, config) {
    this.api = api;
    this.log = log;
    this.i18n = i18n;
    this.config = mergeOptions(DEFAULT_CONFIG, config);
    this.options = this.config.global_opts || {};
    this.cache = new NodeCache({stdTTL: this.config.ttl});

    this.deviceData = null;
    this.accessories = [];
    this.refreshRequired = false;
    this.refreshRunning = false;
    this.refreshCheckRunning = false;

    this.log.debug("ttl: " + this.config.ttl);
    this.log.debug("refresh_check: " + this.config.refresh_check);
    this.log.debug("refresh_run: " + this.config.refresh_run);

    this.runCheckInterval = setInterval(function() {
      if(!this.refreshCheckRunning ) {
        this.refreshCheckRunning = true;
        if(this.refreshRequired) {
          this.log.debug("Executing Timed Refresh");

          this.refreshRequired=false;
          this.refreshDeviceData(function(err, data) {
            if (this.accessories) {
              this.accessories.forEach(function( accessory ) {
                accessory.notifyUpdate(data);
              }.bind(this));
            }
            this.refreshCheckRunning = false;
          }.bind(this));
        } else {
          this.refreshCheckRunning = false;
        }
      }
    }.bind(this), this.config.refresh_run);

    this.refreshDataInterval = setInterval(function() {
      this.refreshRequired = true;
    }.bind(this), this.config.refresh_check);

  }

  buildAccessoriesForDevices(callback) {
    var accessories = [];
    this.refreshDeviceData(function(err, data) {
      if (!err) {
        this.buildAccessories(callback);
      } else {
        callback(err, accessories);
      }
    }.bind(this));
  }

  refreshDeviceData(callback) {
    this.log.debug("Refreshing data for netatmo " + this.deviceType);
    this.cache.get(this.deviceType, function (err, data) {
      if (!err) {
        if (data === undefined || data === null) {
          this.log.debug("Loading new data from netatmo for " + this.deviceType);
          this.loadDeviceData(function(err, data) {
            callback(err,data);
          }.bind(this));
        } else {
          this.deviceData = data;
          callback(null, data);
        }
      } else {
        callback(err, this.deviceData);
      }
    }.bind(this));
  }

  forceRefresh() {
    this.cache.del(this.deviceType, function(err,count) {
      this.refreshRequired = true;
    }.bind(this));
  }

  loadDeviceData(callback) {
    this.deviceData = null;
    callback("The abstract method loadDeviceData should be overridden", null);
  }

  buildAccessories(callback) {   
    Object.keys(this.deviceData).forEach(function(key) {

      // key is id! Should go into blacklist / whitelist !

      var keep = true;

      if (this.config.whitelist && this.config.whitelist.length > 0) {
        keep = (this.config.whitelist.indexOf(key) > -1);
      }
      if (this.config.blacklist && this.config.blacklist.length > 0) {
        keep = keep && (this.config.blacklist.indexOf(key) < 0);
      }

      if ( keep ) {
        var accessory = this.buildAccessory(this.deviceData[key]);
        this.log.debug("Did build accessory " + accessory.name );
        this.accessories.push(accessory);
      }


    }.bind(this));
    callback(null, this.accessories);
  }

  buildName(stationName, moduleName, opts) {
    if (opts.naming_strategy === 'module' && typeof moduleName === 'string') {
      return moduleName;
    } else if ((opts.naming_strategy === 'custom' || typeof opts.naming_strategy === 'undefined') && typeof opts.name === 'string' ) {
      return opts.name;
    }
    if(typeof moduleName === 'string') {
      return stationName + " " + moduleName;
    }
    return stationName;
  }
}

module.exports = NetatmoDevice;