const form = document.getElementById("studentForm");
const message = document.getElementById("message");
const tableBody = document.querySelector("#studentsTable tbody");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const student = {
    name: form.name.value,
    age: form.age.value,
    gender: form.gender.value,
    courses: form.courses.value.split(",").map(c => c.trim())
  };

  const res = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student)
  });

  const data = await res.json();
  message.textContent = data.success ? "Student added" : (data.message || data.error || "Failed to add student");
  form.reset();
  loadStudents();
});

async function loadStudents() {
  const res = await fetch("/api/students");
  const students = await res.json();

  tableBody.innerHTML = "";
  students.forEach(s => {
    const row = `<tr>
      <td>${s.name}</td>
      <td>${s.age}</td>
      <td>${s.gender}</td>
      <td>${(s.courses || []).join(", ")}</td>
    </tr>`;
    tableBody.innerHTML += row;
  });
}

// Load students on page load
loadStudents();