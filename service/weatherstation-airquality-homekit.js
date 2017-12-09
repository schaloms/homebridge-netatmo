'use strict';

var homebridge;
var Characteristic;

module.exports = function(pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    Characteristic = homebridge.hap.Characteristic;
  }

  class AirQualityService extends homebridge.hap.Service.AirQualitySensor {
    constructor(accessory) {
      super(accessory.name + " " + accessory.i18n.__("weather_svc_airquality"));
      this.accessory = accessory;
      this.i18n = accessory.i18n;

      this.getCharacteristic(Characteristic.AirQuality)
        .on('get', this.getAirQuality.bind(this))
        .eventEnabled = true;

    }

    updateCharacteristics() {
      this.getCharacteristic(Characteristic.AirQuality)
            .updateValue(this.transformCO2ToAirQuality());
    }

    getAirQuality(callback) {
      this.accessory.refreshData(function(err,data) {
        callback(err, this.transformCO2ToAirQuality());
      }.bind(this));
    }

    transformCO2ToAirQuality() {
      var level = this.accessory.co2;
      var quality = Characteristic.AirQuality.UNKNOWN;

      if (level >= this.accessory.options.air_quality_poor_threshold) quality = Characteristic.AirQuality.POOR;
      else if (level >= this.accessory.options.air_quality_inferior_threshold) quality = Characteristic.AirQuality.INFERIOR;
      else if (level >= this.accessory.options.air_quality_fair_threshold) quality = Characteristic.AirQuality.FAIR;
      else if (level >= this.accessory.options.air_quality_good_threshold) quality = Characteristic.AirQuality.GOOD;
      else if (level > 0) quality = Characteristic.AirQuality.EXCELLENT;
  
      return quality;
    }

  }

  return AirQualityService;
};
