var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);
  //check due date
  auditTask(taskLi);


  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

//make tasks draggable
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover")
    $(".bottom-trash").addClass("bottom-trash-drag")
  },
  deactivate: function(event) {
    $(this).removeClass("dropover")
    $(".bottom-trash").removeClass("bottom-trash-drag")
  },
  over: function(event) {
    $(event.target).addClass("dropover-active")
    $(".bottom-trash").addClass("bottom-trash-active")
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active")
    $(".bottom-trash").removeClass("bottom-trash-active")
  },
  update: function(event) {
    //array for task data
    var tempArr = [];
    //loop over current set of children in sortable list
    $(this).children().each(function(){
      var text = $(this)
      .find("p")
      .text()
      .trim();
      var date = $(this)
      .find("span")
      .text()
      .trim();
    
      //add task data to the array as an object
      tempArr.push({
        text: text,
        date: date
      });      
    });
    //trim down lists id to mathc object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    //update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();

  }
});

//make trash card work
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
  },
  over: function(event, ui) {
    console.log("over");
  },
  out: function(event, ui) {
    console.log("out");
  }
})
var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};
//edit task content
// delegated <p> click event
$(".list-group").on("click", "p", function() {
  var text = $(this)
  .text()
  .trim();
  var textInput = $("<textarea>")
  .addClass("form-control")
  .val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// triggerd when <p> is clicked away from
$(".list-group").on("blur", "textarea", function() {
  //get the texareas current text
  var text = $(this)
    .val()
    .trim();
  //get parent ul's id
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
    //get the tasks position in the list
    var index = $(this)
    .closest(".list-group-item")
    .index();
    tasks[status][index].text = text;
    saveTasks();
    //recreacte p element
    var taskP = $("<p>")
      .addClass("m-1")
      .text(text);
    //replace text area with p element
    $(this).replaceWith(taskP);
});
//edit date
//due date was clicked
$(".list-group").on("click", "span", function() {
  //get current text
  var date = $(this)
    .text()
    .trim();
  //create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
  //swap out elements
  $(this).replaceWith(dateInput);
  //enable date picker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      //when calendar is closed, force a "change" event on the date input
      $(this).trigger("change");
    }
  });
  //focus on new El
  dateInput.trigger("focus");
});
// value of due date was changed
$(".list-group").on("change", "input[type='text']", function() {
  // get current text
  var date = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);
  // pass tasks li El into auditTask to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

var auditTask = function(taskEl) {
    // get date from task element
    var date = $(taskEl).find("span").text().trim();
    //convert to moment object at 5:00pm
    var time = moment(date, "L").set("hour", 17);
    //remove old classes from El
    $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
    //apply a new class if task is near/over due date
    if (moment().isAfter(time)) {
      $(taskEl).addClass("list-group-item-danger");
    }
    else if (Math.abs(moment().diff(time, "days")) <= 2) {
      $(taskEl).addClass("list-group-item-warning");
    }
};
// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});
//add date picker to modal
$("#modalDueDate").datepicker({
  minDate: 1
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

setInterval(function () {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000);
