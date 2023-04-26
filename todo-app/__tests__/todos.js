/* eslint-disable */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
var cheerio = require("cheerio");
// const csrf = require("csrf");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a new todo and responds with json at /todos POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    const res = await agent.get("/todo");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString().substring(0,10),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(403);
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/todo");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todo");
    expect(res.statusCode).toBe(302);
  });

  test("Marks a todo with given id as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString().substring(0,10),
      completed: false,
      _csrf: csrfToken,
    });

    const todoResponse = await agent.get("/todo").set("Accept", "application/json");
    const parsedResponse = JSON.parse(todoResponse.text);
    const todayItemsCount = parsedResponse.duetoday.length;
    const latestTodo = parsedResponse.duetoday[todayItemsCount - 1];

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);
    const markCompleteResponse = await agent.put(`/todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
        completed: true,
      });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
  test("Marks a todo with given id as Incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString().substring(0,10),
      completed: true,
      _csrf: csrfToken,
    });

    const todoResponse = await agent.get("/todo").set("Accept", "application/json");
    const parsedResponse = JSON.parse(todoResponse.text);
    const todayItemsCount = parsedResponse.duetoday.length;
    const latestTodo = parsedResponse.duetoday[todayItemsCount - 1];

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);
    const markCompleteResponse = await agent.put(`/todos/${latestTodo.id}`).send({
        _csrf: csrfToken,
        completed: false,
      });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });
  test("Delete a todo ", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString().substring(0,10),
      completed: false, //
      _csrf: csrfToken,
    });

    const todoResponse = await agent.get("/todo").set("Accept", "application/json");
    const parsedResponse = JSON.parse(todoResponse.text);
    const allTodosCount = parsedResponse.allTodos.length;
    const latestTodo = parsedResponse.allTodos[allTodosCount - 1];

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);

    const deletedResponse = await agent
      .delete(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken });
    const parsedDeletedResponse = JSON.parse(deletedResponse.text);
    expect(parsedDeletedResponse.success).toBe(true);
    expect(deletedResponse.statusCode).toBe(200);
  }); 
})
 