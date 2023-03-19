'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static async addTask(params) {
      return  await Todo.create(params);
    }
    static associate(models) {
      // define association here
    }
    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      // FILL IN HERE
      const overdue = await Todo.overdue();
      console.log(overdue.map((item) => item.displayableString()).join("\n"));
      console.log("\n");

      console.log("Due Today");
      // FILL IN HERE
      const dueToday = await Todo.dueToday();
      console.log(dueToday.map((item) => item.displayableString()).join("\n"));
      console.log("\n");

      console.log("Due Later");
      const laterdue = await Todo.dueLater();
      console.log(laterdue.map((item) => item.displayableString()).join("\n"));
      // FILL IN HERE
    }

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      return Todo.findAll({
        where:{
          duedate:{
            [Op.lt]: new Date(), competed: false
          },
        },
        order: [["id","ASC"]],
      });
    }

    static async dueToday() {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      return Todo.findAll({
        where:{
          duedate:{
            [Op.eq]: new Date(), competed: false
          },
        },
        order: [["id","ASC"]],
      });
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      return Todo.findAll({
        where:{
          duedate:{
            [Op.gt]: new Date(), competed: false
          },
        },
        order: [["id","ASC"]],
      });
    }

    static async markAsComplete(id) {
      // FILL IN HERE TO MARK AN ITEM AS COMPLETE
      return Todo.update(
        {completed : true},
        {
          where:{
            id,
          },
        }
      );
   }
    displayableString() {
      let check = this.completed ? "[x]" : "[ ]";
      let date = this.dueDate === new Date().toISOString("en-CA") ? "" :this.dueDate;

      return `${this.id}. ${check} ${this.title} ${date}`.trim;
    }
  }
  Todo.init({
    title: DataTypes.STRING,
    dueDate: DataTypes.DATEONLY,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todo;
};