// Slim-v1 schema definition + conversion helpers.
//
// Kept in its own module so the migration script can import it
// without dragging in node-fetch / dotenv / network code.

export const SLIM_SCHEMA_VERSION = "slim-v1";

// Fat (OpenSky native) → slim row.
//   fat:  [icao24, callsign, origin_country, time_position, last_contact,
//          longitude, latitude, baro_altitude, on_ground, velocity,
//          true_track, vertical_rate, sensors, geo_altitude, squawk, spi,
//          position_source, category]
//   slim: [icao24, callsign, origin_country, longitude, latitude,
//          on_ground, velocity, true_track, geo_altitude]
const slimState = (s) => [
  s[0],
  s[1],
  s[2],
  s[5],
  s[6],
  s[8],
  s[9],
  s[10],
  s[13],
];

// Wraps an OpenSky-shaped response into the slim envelope. Preserves
// `time`, adds `schema`, and slims every state row. Non-array `states`
// is coerced to []; null `data.time` is passed through unchanged so
// the file name can still be derived from it.
export const slimResponse = (data) => ({
  time: data?.time,
  schema: SLIM_SCHEMA_VERSION,
  states: Array.isArray(data?.states) ? data.states.map(slimState) : [],
});
