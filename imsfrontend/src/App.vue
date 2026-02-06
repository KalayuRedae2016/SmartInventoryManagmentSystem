
<script setup>
import { ref } from 'vue';
  const name = ref('Kalayu, Redae!');
  const status = ref("active");
  const tasks = ref(["task One", "task Two", "task Three"]);
  const newTask = ref("");

  const link = "https://www.kalayuredae.com";
  
  const toggleStatus = () => {
    if (status.value === "active") {
      status.value = "inactive";
    } else if (status.value === "inactive") {
      status.value = "pending";
    } else {
      status.value = "active";
    }
  };

const addTask=() => {
    if (newTask.value.trim() !== "") {
      tasks.value.push(newTask.value.trim());
      newTask.value = "";
    }
  };

const deleteTask=(index) => {
    tasks.value.splice(index, 1);
  };

</script>
<template>
  <!-- <router-view /> -->
   <h1>{{ name }}</h1>
   <p v-if="status === 'active'">User is Active</p>
   <p v-else-if="status==='pending'">User is Pending</p>
   <p v-else>User is Inactive</p>
   <h3>Tasks:</h3>
   <ul>
    <li v-for="task in tasks" :key="task">{{ task }}</li>
   </ul>
    <a :href="link" target="_blank">Visit My Website</a>
    
    <form @submit.prevent="addTask">
      <label for="addTask">Add a new task:</label>
      <input v-model="newTask" placeholder="Add a new task" id="addTask" />
      <button type="submit">Add Task</button>
    </form>

    <button @click="deleteTask(tasks.length - 1)">Delete Last Task</button>

  <button @click="toggleStatus">Change Status</button>
</template>

<style scoped>
h1 {
  text-align: center;
  margin-top: 50px;
  color: red;
}
button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  font-size: 16px;
  color: rgb(0, 174, 255);
}
</style>