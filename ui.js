// Define UI elements
var ui = {
  robotState: document.getElementById("robot-state"),
  autonomous: {
    modes: [],
    current: ""
  },
  elevatorManip: {
    hatch: {
      lift: false,
      actuator: false
    },
    cargo: {
      lift: false,
      actuator: 0
    }
  },
  robotDiagram: {
    elevator: document.getElementById("elevator"),
    hatch: document.getElementById("elev-hatch-arm"),
    cargo: document.getElementById("elev-cargo-arm")
  },
  elevatorHeight: {
    val: 0,
    elem: document.getElementById("elevator-height")
  },
  ds: {
    station: 0,
    red: false,
    sim: false
  }
};

function updateDS() {
  if (ui.ds.sim) {
    $("#driver-station").html("Simulation");
  } else {
    let val = ui.ds.red ? "Red " : "Blue ";
    val += ui.ds.station;
    $("#driver-station").html(val);
  }
}

var ntValues = {};
var tuning_keys = [
  ["/components/drivetrain/forward_multiplier", "Drivetrain: Drive Speed Mult"],
  ["/components/drivetrain/strafe_multiplier", "Drivetrain: Strafe Mult"],
  ["/components/drivetrain/rotate_multiplier", "Drivetrain: Rotate Mult"],
  [
    "/components/drivetrain/gyro_rotate_to_angle_multiplier",
    "Drivetrain: Gyro Rotate Mult"
  ],
  [
    "/components/drivetrain/slow_forward_multiplier",
    "Drivetrain: Slow Drive Speed Mult"
  ],
  [
    "/components/drivetrain/slow_strafe_multiplier",
    "Drivetrain: Slow Strafe Mult"
  ],
  [
    "/components/drivetrain/slow_rotate_multiplier",
    "Drivetrain: Slow Rotate Mult"
  ],
  ["/components/elevator/gear_ratio", "Elevator: Motor Gear Ratio"],
  ["/components/elevator/hatch_height_const", "Elevator: Hatch Height Offset"],
  ["/components/elevator/cargo_height_const", "Elevator: Cargo Height Offset"],
  ["/components/elevator/ticks_per_rot", "Elevator: Encoder Ticks"],
  ["/components/cargo/motor_input_speed", "Cargo: Motor Intake Speed"],
  ["/components/cargo/motor_output_speed", "Cargo: Motor Output Speed"]
];

var tuning = {};

var t = $("#tuning");

for (var i = 0; i < tuning_keys.length; i++) {
  let key = tuning_keys[i][0];
  tuning = {
    ...tuning,
    [key]: {
      label: tuning_keys[i][1],
      id: i,
      value: "",
      editing: false
    }
  };

  let tuningElem = $(document.createElement("div"))
    .attr("id", "tuning" + key)
    .addClass("tuning-item");
  let label = tuningElem.append(
    $(document.createElement("h4")).text(tuning[key].label)
  );
  let value = tuningElem.append(
    $(document.createElement("input"))
      .attr("type", "number")
      .prop("disabled", true)
      .addClass("tuning-value")
      .val(tuning[key].text)
  );
  let editButton = $(document.createElement("button"))
    .addClass("tuning-button")
    .attr("key", key)
    .text("Edit")
    .click(function() {
      let key = $(this).attr("key");
      let es_key = key.replace(/\//g, "\\/");
      tuning[key].editing = !tuning[key].editing;
      let val = $("#tuning" + es_key + " input").val();
      $("#tuning" + es_key + " input").prop("disabled", !tuning[key].editing);
      NetworkTables.put(key, parseInt(val));
    });

  tuningElem.append(editButton);

  tuningElem.append(label);
  tuningElem.append(value);

  t.append(tuningElem);
}

// Sets function to be called on NetworkTables connect. Commented out because it's usually not necessary.
// NetworkTables.addWsConnectionListener(onNetworkTablesConnection, true);
// Sets function to be called when robot dis/connects
NetworkTables.addRobotConnectionListener(onRobotConnection, true);
// Sets function to be called when any NetworkTables key/value changes
NetworkTables.addGlobalListener(onValueChanged, true);

function onRobotConnection(connected) {
  var state = connected ? "Robot connected!" : "Robot disconnected.";
  console.log(state);

  ui.robotState.innerHTML = state;
}

function onValueChanged(key, value, isNew) {
  // Sometimes, NetworkTables will pass booleans as strings. This corrects for that.
  if (value == "true") {
    value = true;
  } else if (value == "false") {
    value = false;
  }
  ntValues[key] = value;

  if (key.toLowerCase().includes("robot")) {
    console.log(key);
  }
  switch (key) {
    // Hatch NT Values
    case "/components/hatch/is_in_position":
      // ui.elevatorManip.hatch.lift.val = value;
      var angle = value ? 0 : 45;
      // ui.robotDiagram.hatch.style.transform = `rotate(${angle}deg)`;
      robot.elevator.hatch.is_in_position = value;
    case "/components/hatch/is_holding":
      break;
    case "/components/elevator/height":
      robot.elevator.currentHeight = value;
      break;
    case "/FMSInfo/StationNumber":
      ui.ds.station = value;
      updateDS();
      break;
    case "/FMSInfo/IsRedAlliance":
      ui.ds.red = value;
      updateDS();
      break;
    case "/robot/is_simulation":
      ui.ds.sim = value;
      updateDS();
      break;
  }

  if (Object.keys(tuning).includes(key)) {
    tuning[key].val = value;
    let es_key = key.replace(/\//g, "\\/");
    $("#tuning" + es_key + " input").val(value);
  }
}
