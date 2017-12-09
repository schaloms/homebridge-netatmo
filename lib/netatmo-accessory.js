'use strict';

var inherits = require('util').inherits;
var Accessory, Service, Characteristic, uuid;
var homebridge;

var glob = require( 'glob' ), path = require( 'path' );

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    Characteristic = homebridge.hap.Characteristic;
    Accessory = homebridge.hap.Accessory;
    Service = homebridge.hap.Service;
  }

  class NetatmoAccessory extends Accessory {
    constructor(homebridge, accessoryConfig, netatmoDevice) {

      var name = accessoryConfig.name || "Netatmo " + netatmoDevice.deviceType + " " + accessoryConfig.id; 
      var uid = homebridge.hap.uuid.generate('netatmo.' + accessoryConfig.netatmoType + '.' + accessoryConfig.id);
      super(name, uid);

      this.log = netatmoDevice.log;
      this.i18n = netatmoDevice.i18n;
      this.config = netatmoDevice.config;
      this.device = netatmoDevice;
      this.id = accessoryConfig.id;
      this.name = name;
      this.deviceType = netatmoDevice.deviceType;
      this.netatmoType = accessoryConfig.netatmoType;
      this.firmware = accessoryConfig.firmware;
      this.dataTypes = accessoryConfig.dataTypes;
      this.options = accessoryConfig.options || {};

      this._configureAccessoryInformationService();
      this._buildServices(accessoryConfig.defaultServices);
    }

    getServices() {
      return this.services;
    }

    isSupportedService(serviceType) {
      return ( this.configuredServices.indexOf(serviceType) > -1 );
    }

    _configureAccessoryInformationService() {

      var accessoryInformationService = this.getService(Service.AccessoryInformation);

      var fwChar = accessoryInformationService.getCharacteristic(Characteristic.FirmwareRevision) ||
                   accessoryInformationService.addCharacteristic(Characteristic.FirmwareRevision);

      accessoryInformationService
        .setCharacteristic(Characteristic.Model, "Netatmo " + this.deviceType + " (" + this.netatmoType + ")")
        .setCharacteristic(Characteristic.SerialNumber, this.id)
        .setCharacteristic(Characteristic.Manufacturer, "Netatmo")
        .setCharacteristic(Characteristic.FirmwareRevision, this.firmware);
    }

    loadConfiguredServices(defaultServices) {
      if (this.config[this.netatmoType]) {
        this.configuredServices = this.config[this.netatmoType].services || this.config.services || defaultServices;
      } else {
        this.configuredServices = this.config.services || defaultServices;
      }
    }

    notifyUpdate(deviceData) {
      console.log("Method notifyUpdate should have been overriden " + this.name);
    }

    _buildServices(defaultServices) {
      this.loadConfiguredServices(defaultServices);
      var serviceDir = path.dirname(__dirname) + '/service';
      var globprefix = this.deviceType;

      glob.sync( globprefix + '-*.js', { 'cwd': serviceDir } ).forEach(
        function( file ) {
          try {
            var NetatmoService = require( serviceDir + '/' + file )(homebridge);
            var svcName = file.slice(globprefix.length + 1, -3);
            if(this.isSupportedService(svcName)) {
              this.log.debug("Adding Service in " + this.name + ": " + svcName);
              var service = new NetatmoService(this);
              this.log.debug("-> " + service.displayName);
              this.addService(service);

            } else {
              this.log.debug("Service not supported in " + this.name + ": "  + svcName);
            }
          } catch (err) {
            this.log.warn("Could not process service file " + file);
            this.log.warn(err);
            this.log.warn(err.stack); 
          }
        }.bind(this)
      );
    }

  }

  return NetatmoAccessory;

};
