// Define UI elements
var ui = {
  robotState: document.getElementById("robot-state"),
  elevatorManip: {
    hatch: {
      lift: false,
      actuator: false
    },
    cargo: {
      lift: false,
      actuator: false
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
  }
};

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

  // This switch statement chooses which UI element to update when a NetworkTables variable changes.
  switch (key) {
    case "/components/hatch/is_in_position":
      console.log(value);
      ui.elevatorManip.hatch.lift.val = value;
      var angle = value ? 0 : 45;
      ui.robotDiagram.hatch.style.transform = `rotate(${angle}deg)`;
    case "/components/elevator/height":
      ui.elevatorHeight.val = value;
      ui.elevatorHeight.elem.innerHTML =
        ui.elevatorHeight.val.toFixed(2) + " in";
      if (value > 96) {
        value = 96;
      } else if (value < 0) {
        value = 0;
      }
      ui.robotDiagram.elevator.setAttribute("y", 290 - value * 3);
      ui.robotDiagram.elevator.style.transform = `translate(0, ${-value *
        2}px)`;
      break;
  }

  // The following code manages tuning section of the interface.
  // This section displays a list of all NetworkTables variables (that start with /SmartDashboard/) and allows you to directly manipulate them.
  var propName = key.substring(16, key.length);
  // Check if value is new and doesn't have a spot on the list yet
  if (isNew && !document.getElementsByName(propName)[0]) {
    // Make sure name starts with /SmartDashboard/. Properties that don't are technical and don't need to be shown on the list.
    if (key.substring(0, 16) === "/SmartDashboard/") {
      // Make a new div for this value
      var div = document.createElement("div"); // Make div
      ui.tuning.list.appendChild(div); // Add the div to the page

      var p = document.createElement("p"); // Make a <p> to display the name of the property
      p.innerHTML = propName; // Make content of <p> have the name of the NetworkTables value
      div.appendChild(p); // Put <p> in div

      var input = document.createElement("input"); // Create input
      input.name = propName; // Make its name property be the name of the NetworkTables value
      input.value = value; // Set
      // The following statement figures out which data type the variable is.
      // If it's a boolean, it will make the input be a checkbox. If it's a number,
      // it will make it a number chooser with up and down arrows in the box. Otherwise, it will make it a textbox.
      if (value === true || value === false) {
        // Is it a boolean value?
        input.type = "checkbox";
        input.checked = value; // value property doesn't work on checkboxes, we'll need to use the checked property instead
      } else if (!isNaN(value)) {
        // Is the value not not a number? Great!
        input.type = "number";
      } else {
        // Just use a text if there's no better manipulation method
        input.type = "text";
      }
      // Create listener for value of input being modified
      input.onchange = function() {
        switch (
          input.type // Figure out how to pass data based on data type
        ) {
          case "checkbox":
            // For booleans, send bool of whether or not checkbox is checked
            NetworkTables.setValue(key, input.checked);
            break;
          case "number":
            // For number values, send value of input as an int.
            NetworkTables.setValue(key, parseInt(input.value));
            break;
          case "text":
            // For normal text values, just send the value.
            NetworkTables.setValue(key, input.value);
            break;
        }
      };
      // Put the input into the div.
      div.appendChild(input);
    }
  } else {
    // If the value is not new
    // Find already-existing input for changing this variable
    var oldInput = document.getElementsByName(propName)[0];
    if (oldInput) {
      // If there is one (there should be, unless something is wrong)
      if (oldInput.type === "checkbox") {
        // Figure out what data type it is and update it in the list
        oldInput.checked = value;
      } else {
        oldInput.value = value;
      }
    } else {
      // console.log(
      //   "Error: Non-new variable " + key + " not present in tuning list!"
      // );
    }
  }
}

// The rest of the doc is listeners for UI elements being clicked on
ui.example.button.onclick = function() {
  // Set NetworkTables values to the opposite of whether button has active class.
  NetworkTables.setValue(
    "/SmartDashboard/exampleVariable",
    this.className != "active"
  );
};

// Reset gyro value to 0 on click
ui.gyro.container.onclick = function() {
  // Store previous gyro val, will now be subtracted from val for callibration
  ui.gyro.offset = ui.gyro.val;
  // Trigger the gyro to recalculate value.
  onValueChanged("/SmartDashboard/drive/navX/yaw", ui.gyro.val);
};

// Open tuning section when button is clicked
ui.tuning.button.onclick = function() {
  if (ui.tuning.list.style.display === "none") {
    ui.tuning.list.style.display = "block";
  } else {
    ui.tuning.list.style.display = "none";
  }
};

// Manages get and set buttons at the top of the tuning pane
ui.tuning.set.onclick = function() {
  // Make sure the inputs have content, if they do update the NT value
  if (ui.tuning.name.value && ui.tuning.value.value) {
    NetworkTables.setValue(
      "/SmartDashboard/" + ui.tuning.name.value,
      ui.tuning.value.value
    );
  }
};
ui.tuning.get.onclick = function() {
  ui.tuning.value.value = NetworkTables.getValue(ui.tuning.name.value);
};

// Update NetworkTables when autonomous selector is changed
ui.autoSelect.onchange = function() {
  NetworkTables.setValue("/SmartDashboard/autonomous/selected", this.value);
};

// Get value of arm height slider when it's adjusted
ui.armPosition.oninput = function() {
  NetworkTables.setValue("/SmartDashboard/arm/encoder", parseInt(this.value));
};
