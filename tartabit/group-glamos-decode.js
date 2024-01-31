/* Tartabit Trigger - Decode Payload
Details

Trigger name:
  <group>-<device>-decode

Description:
  <group long name> - <Name of Device> Decode Payload
  
Event type:
  Generic Event

Custom filters:
  key===<group>-<device>-decode

*/

// Decode the Payload from Base64 using Byte Buffer

var tag_set = event.data.data.tag_set
var field_set = event.data.data.field_set
var decode_set = event.data.data.decode_set
var port = decode_set.port
var payload = decode_set.payload

if (payload !== null) {
    // Setup Payload Buffer
    var buffer = convert.b64ToBin(payload)
    var buff_type = typeof buffer

    // log.trace('Buffer length:' + buffer.length + ', buffer:' + buffer)

    // Decode then enrich telemetry
    var decoded_payload = Decoder(buffer,port)

    gps_valid = decoded_payload.gps_valid
    if (gps_valid) {
        field_set.gps_valid = true
        field_set.latitude = decoded_payload.latitude
        field_set.longitude = decoded_payload.longitude
        field_set.altitude = decoded_payload.altitude
    } else {
        field_set.gps_valid = false
    }
    field_set.position = decoded_payload.position
    field_set.antenna = decoded_payload.antenna
}
// log.trace('Field Set:\n' + JSON.stringify(field_set))

//send to Save the Props and the Telem
exec.now('<group>-glamos-save', {
    tag_set: tag_set,
    field_set: field_set
})

function Decoder(bytes, port) {
    // Decode an uplink message from a buffer (array) of bytes to an object of fields.
    //Decoder for GLAMOS Walker device.

    var decoded = {}

    // Three bytes of Latitude/Longitude. 24 bits is less accurate than than 5 bits of decimal.
    // The fifth decimal place is worth up to 1.1 m: it distinguish trees from each other. Only save 5 bits.
    // Accuracy to this level with commercial GPS units can only be achieved with differential correction

    lat = ((bytes[0]<<16)>>>0) + ((bytes[1]<<8)>>>0) + bytes[2]
    long = ((bytes[3]<<16)>>>0) + ((bytes[4]<<8)>>>0) + bytes[5]
    GPS_ZERO = 8388607
    if (lat == GPS_ZERO && long == GPS_ZERO) {
        decoded.gps_valid = false
    } else {
        decoded.gps_valid = true
        decoded.latitude = (lat / 16777215.0 * 180) - 90
        decoded.latitude = Number(decoded.latitude.toFixed(5))
   
        decoded.longitude = (long / 16777215.0 * 360) - 180
        decoded.longitude = Number(decoded.longitude.toFixed(5))
        
        var altValue = ((bytes[6]<<8)>>>0) + bytes[7]
        var sign = bytes[6] & (1 << 7)
        if(sign) {
            decoded.altitude = 0xFFFF0000 | altValue
        } else {
            decoded.altitude = altValue
        }
    }

    decoded.antenna  = bytes[8]
    decoded.position = bytes[9]

    return decoded
}