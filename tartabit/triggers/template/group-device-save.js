/* Tartabit Trigger - Save to InfluxDB Measurement
Details

Trigger name:
  <group>-<device>-save

Description:
  <group long name> - <Name of Device> Save Telemetry
  
Event type:
  Generic Event

Custom filters:
  key===<group>-<device>-save

*/

var tag_set = event.data.data.tag_set;
var field_set = event.data.data.field_set;

// set Group, Device, and Measurement Name (table).
influxdb.publish('<group>-<device>-influxdb', '<measurement_name>' ,tag_set, field_set);