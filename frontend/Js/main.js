const API_BASE = "http://localhost:3000";
let tasksData = [];
let usersData = [];
let currentFilter = "الكل";
let taskIdCounter = 1;

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }

  return response.status === 204 ? null : response.json();
}

function renderUsersDropdown() {
  let ownerSelect = document.getElementById("taskOwnerInput");
  if (!ownerSelect) return;

  ownerSelect.innerHTML =
    '<option value="" selected disabled>Select an owner...</option>';

  usersData.forEach((user) => {
    let option = document.createElement("option");
    option.value = user;
    option.textContent = user;
    ownerSelect.appendChild(option);
  });
}

async function loadUsers() {
  try {
    const data = await apiRequest("/users");
    usersData = (Array.isArray(data) ? data : [])
      .map((user) => user.name || user.fullName || user.userName)
      .filter(Boolean);
    renderUsersDropdown();
  } catch (error) {
    console.error("Error loading users:", error);
    usersData = [];
    renderUsersDropdown();
  }
}

async function loadTasks() {
  try {
    const data = await apiRequest("/task");
    tasksData = Array.isArray(data) ? data : [];
    if (tasksData.length) {
      taskIdCounter =
        Math.max(...tasksData.map((task) => Number(task.id) || 0)) + 1;
    } else {
      taskIdCounter = 1;
    }
    renderTable();
  } catch (error) {
    console.error("Error loading tasks:", error);
    tasksData = [];
    renderTable();
  }
}

function renderTable() {
  let tableBody = document.getElementById("tableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  let filteredTasks = tasksData.filter((task) => {
    if (currentFilter === "الكل") return true;
    return task.status === currentFilter;
  });

  filteredTasks.forEach((task) => {
    let btnClass = "btn-secondary";
    if (task.status === "قيد التنفيذ") btnClass = "btn-warning";
    if (task.status === "منفذة") btnClass = "btn-success";

    let statusDropdown = `
            <div class="dropdown">
                <button class="btn ${btnClass} btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    ${task.status || "لم يبدأ"}
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="updateTaskStatus(${task.id}, 'لم يبدأ')">لم يبدأ</a></li>
                    <li><a class="dropdown-item" href="#" onclick="updateTaskStatus(${task.id}, 'قيد التنفيذ')">قيد التنفيذ</a></li>
                    <li><a class="dropdown-item" href="#" onclick="updateTaskStatus(${task.id}, 'منفذة')">منفذة</a></li>
                </ul>
            </div>
        `;

    let row = `
            <tr>
                <th scope="row">${task.id}</th>
                <td>${task.owner || "-"}</td>
                <td>${task.name || "-"}</td>
                <td>${task.description || "-"}</td>
                <td>${statusDropdown}</td>
            </tr>
        `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

let userForm = document.getElementById("createUserForm");
let userModal = document.getElementById("userModal");

userForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  let newUserName = document.getElementById("userNameInput").value.trim();
  let userGender = document.getElementById("userGenderInput").value;

  if (!newUserName) return;

  if (!usersData.includes(newUserName)) {
    try {
      const createdUser = await apiRequest("/users", {
        method: "POST",
        body: JSON.stringify({
          name: newUserName,
          gender: userGender,
          taskid: "",
        }),
      });

      usersData.push(createdUser.name || newUserName);
      renderUsersDropdown();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.message);
      return;
    }
  }

  userForm.reset();
  let modalInstance = bootstrap.Modal.getInstance(userModal);
  if (modalInstance) {
    modalInstance.hide();
  }
});

let taskForm = document.getElementById("createTaskForm");
let taskModal = document.getElementById("taskModal");

taskForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  let newTask = {
    owner: document.getElementById("taskOwnerInput").value,
    name: document.getElementById("taskNameInput").value.trim(),
    description: document.getElementById("taskDescInput").value.trim(),
    status: "لم يبدأ",
  };

  if (!newTask.owner || !newTask.name || !newTask.description) return;

  try {
    const createdTask = await apiRequest("/task", {
      method: "POST",
      body: JSON.stringify(newTask),
    });

    tasksData.push(createdTask);
    taskIdCounter = Math.max(taskIdCounter, Number(createdTask.id) + 1);
    renderTable();
  } catch (error) {
    console.error("Error creating task:", error);
    alert(error.message);
    return;
  }

  taskForm.reset();
  let modalInstance = bootstrap.Modal.getInstance(taskModal);
  if (modalInstance) {
    modalInstance.hide();
  }
});

window.updateTaskStatus = async function (taskId, newStatus) {
  const task = tasksData.find((t) => Number(t.id) === Number(taskId));
  if (!task) return;

  try {
    const updatedTask = await apiRequest(`/task/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });

    task.status = updatedTask.status;
    renderTable();
  } catch (error) {
    console.error("Error updating task status:", error);
    alert(error.message);
  }
};

document.querySelectorAll('input[name="btnradio"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    currentFilter = this.value;
    renderTable();
  });
});

loadUsers();
loadTasks();
