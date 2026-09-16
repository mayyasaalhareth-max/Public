let tasksData = [];
let usersData = ["مجد", "الحارث", "ياسر"];
let currentFilter = "الكل";



function renderUsersDropdown() {
  let ownerSelect = document.getElementById("taskOwnerInput");
  ownerSelect.innerHTML =
    '<option value="" selected disabled>Select an owner...</option>'; // تفريغ القائمة أولاً

  usersData.forEach((user) => {
    let option = document.createElement("option");
    option.value = user;
    option.textContent = user;
    ownerSelect.appendChild(option);
  });
}

let userForm = document.getElementById("createUserForm");
let userModal = document.getElementById("userModal");

userForm.addEventListener("submit", function (event) {
  event.preventDefault();

  let newUserName = document.getElementById("userNameInput").value;

  // التأكد من عدم تكرار الاسم قبل إضافته
  if (!usersData.includes(newUserName)) {
    usersData.push(newUserName);
    renderUsersDropdown(); 
  }

  // تفريغ الحقول وإغلاق النافذة
  userForm.reset();
  let modalInstance = bootstrap.Modal.getInstance(userModal);
  modalInstance.hide();
});



function renderTable() {
  let tableBody = document.getElementById("tableBody");
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
                    ${task.status}
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
                <td>${task.owner}</td>
                <td>${task.name}</td>
                <td>${task.description}</td>
                <td>${statusDropdown}</td>
            </tr>
        `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

// 4. معالجة إضافة مهمة جديدة
let taskForm = document.getElementById("createTaskForm");
let taskModal = document.getElementById("taskModal");

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  let newTask = {
    id: taskIdCounter++,
    owner: document.getElementById("taskOwnerInput").value,
    name: document.getElementById("taskNameInput").value,
    description: document.getElementById("taskDescInput").value,
    status: "لم يبدأ",
  };

  tasksData.push(newTask);
  renderTable();

  taskForm.reset();
  let modalInstance = bootstrap.Modal.getInstance(taskModal);
  modalInstance.hide();
});

// 5. دالة تحديث حالة المهمة
window.updateTaskStatus = function (taskId, newStatus) {
  let task = tasksData.find((t) => t.id === taskId);
  if (task) {
    task.status = newStatus;
    renderTable();
  }
};

// 6. ربط أزرار الفلترة
document.querySelectorAll('input[name="btnradio"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    currentFilter = this.value;
    renderTable();
  });
});

// استدعاء أولي لتعبئة قائمة المستخدمين عند فتح الصفحة لأول مرة
renderUsersDropdown();
