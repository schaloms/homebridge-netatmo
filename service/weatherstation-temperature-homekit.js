'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    Characteristic = homebridge.hap.Characteristic;
  }

  class TemperatureService extends homebridge.hap.Service.TemperatureSensor {
    constructor(accessory) {
      super(accessory.name + " " + accessory.i18n.__("weather_svc_temperature"));
      this.accessory = accessory;
      this.i18n = accessory.i18n;

      var tmpChar = this.getCharacteristic(Characteristic.CurrentTemperature);
      tmpChar.setProps({ minValue: -100 });
      tmpChar.on('get', this.getCurrentTemperature.bind(this));
      tmpChar.eventEnabled = true;

    }

    updateCharacteristics() {
      this.getCharacteristic(Characteristic.CurrentTemperature)
            .updateValue(this.accessory.currentTemperature);
    }

    getCurrentTemperature(callback) {
      this.accessory.refreshData(function(err,data) {
        callback(err, this.accessory.currentTemperature);
      }.bind(this));
    }
  }

  return TemperatureService;
};
