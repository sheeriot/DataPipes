/*
Details

Trigger name:
  <group>-<device>-post

Description:
  <group long name> - <Name of Device> Device Uplink
  
Event type:
  HTTP Post

Filter by service
  <group>-<device>-lns


Custom filters:
  body.type==uplink

*/
// Note: on Tartabit, LNS service provides data to trigger as `event`

/* Setup for InfluxDB
- two "tags", aka primary index fields
- other values are stored in field_set
*/

tag_set = {
    dev_eui: event.data.body.meta.device,
    gateway: event.data.body.meta.gateway,
}

field_set = {
    counter_up: event.data.body.params.counter_up,
    device_addr: event.data.body.meta.device_addr,
    duplicate: event.data.body.params.duplicate,
    frequency: event.data.body.params.radio.freq,
    bandwidth: event.data.body.params.radio.modulation.bandwidth,
    spreading_factor: event.data.body.params.radio.modulation.spreading,
    datarate: event.data.body.params.radio.datarate,
    rssi: event.data.body.params.radio.hardware.rssi,
    snr: event.data.body.params.radio.hardware.snr,
    rx_time: event.data.body.params.rx_time,
    frame_size: event.data.body.params.radio.size,
    gw_latitude: Number(event.data.body.params.radio.hardware.gps.lat.toFixed(5)),
    gw_longitude:  Number(event.data.body.params.radio.hardware.gps.lng.toFixed(5)),
}

/* note tags form the pipeline are NOT influxDB record tags 
     - as defined in influxDB records (lne protocol)
     - the device tags are stored as field values for use by applications
     - e.g. loc-pluscode and ubi-device-group
*/

tags = event.data.body.meta.tags
for (key in tags) {
    if (key === '2') { break; }
    field_set['tag'+(Number(key)+1)] = tags[key]
}

// pass this on for the decoder trigger
decode_set = {
    payload: event.data.body.params.payload,
    port: event.data.body.params.port,
}

// edit the value below for your pipeline name
exec.now('<group>-<device>-decode', {
  tag_set: tag_set,
  field_set: field_set,
  decode_set: decode_set
})

// respond to http client
trigger.reply({status:200})
