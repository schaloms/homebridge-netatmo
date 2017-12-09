'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    Characteristic = homebridge.hap.Characteristic;
  }

  class CarbonDioxideService extends homebridge.hap.Service.CarbonDioxideSensor {
    constructor(accessory) {
      super(accessory.name + " " + accessory.i18n.__("weather_svc_co2"));
      this.accessory = accessory;
      this.i18n = accessory.i18n;

      this.getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on('get', this.getCarbonDioxideDetected.bind(this))
        .eventEnabled = true;

      var co2LevelCharacteristic = this.getCharacteristic(Characteristic.CarbonDioxideLevel) ||
                                   this.addCharacteristic(Characteristic.CarbonDioxideLevel);

      co2LevelCharacteristic.on('get', this.getCarbonDioxideLevel.bind(this))
                            .eventEnabled = true;
    }

    updateCharacteristics() {
      this.getCharacteristic(Characteristic.CarbonDioxideDetected)
            .updateValue(this.transformCO2ToCarbonDioxideDetected());
      this.getCharacteristic(Characteristic.CarbonDioxideLevel)
            .updateValue(this.accessory.co2);
    }

    getCarbonDioxideDetected(callback) {
      this.accessory.refreshData(function(err,data) {
        callback(err, this.transformCO2ToCarbonDioxideDetected());
      }.bind(this));
    }

    getCarbonDioxideLevel(callback) {
      this.accessory.refreshData(function(err,data) {
        callback(err, this.accessory.co2);
      }.bind(this));
    }

    transformCO2ToCarbonDioxideDetected() {
      return (this.accessory.co2 >= this.accessory.options.co2_warning_threshold ? Characteristic.CarbonDioxideDetected.CO2_LEVELS_ABNORMAL 
                                                                                 : Characteristic.CarbonDioxideDetected.CO2_LEVELS_NORMAL);
    }
  }

  return CarbonDioxideService;
};
