/* eslint-disable no-undef */
const todoList = require("../todo");

const { all, markAsComplete, add, dueToday, dueLater, overdue } = todoList();

describe("TodoList Test Suite", () => {
  test("New todo added", () => {
    const todoItemsCount = all.length;
    expect(all.length).toBe(todoItemsCount);
    add({
      title: "Test todo",
      completed: false,
      dueDate: new Date().toISOString()
    });
    expect(all.length).toBe(todoItemsCount + 1);
  });

  test("Marked as complete", () => {
    expect(all[0].completed).toBe(false);
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
  });

  test("Due today test", () => {
    var today = new Date();
    add({
      title: "Today test",
      completed: false,
      dueDate: today.toISOString()
    });
    expect(dueToday().length).toBe(0);
  });

  test("Due Later test", () => {
    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    add({
      title: "Later test",
      completed: false,
      dueDate: tomorrow.toISOString()
    });

    expect(dueLater().length).toBe(0);
  });

  test("OverDue test", () => {
    var today = new Date();
    var yesterday = today;
    yesterday.setDate(yesterday.getDate() - 1);

    add({
      title: "Overdue test",
      completed: true,
      dueDate: yesterday.toISOString()
    });

    expect(overdue().length).toBe(0);
  });
});
