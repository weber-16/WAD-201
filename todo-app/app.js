/* eslint-disable */
const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const path = require("path");
app.use(express.urlencoded({extended:false}));

// ejs as view engine
app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  const allTodos = await Todo.getTodos();
  const overdue = await Todo.overdue();
  const duetoday = await Todo.dueToday();
  const duelater = await Todo.dueLater();
  if (request.accepts("html")) {
    response.render('index', {
      allTodos,
      overdue,
      duetoday,
      duelater
    });
  } else {
    response.json({
      allTodos,
      overdue,
      duetoday,
      duelater
    });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (request, response) {
  response.send("Hello World");
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE

  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
  try {
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    //return response.json(todo);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // FILL IN YOUR CODE HERE

  //const todo = await Todo.findByPk(request.params.id);
  try {
    // const delTodo = await todo.deleteTodo();
    // response.json(true);
    // return true;
    await Todo.remove(request.params.id);
    return response.json({success:true})
  } catch (error) {
    // console.error(error);
    // response.status(422).json(false);
    // return false;
    return response.status(422).json(error);
  }
});

module.exports = app;

/*eslint-disable no-unused-vars */
