"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      })
      // define association here
    }

    static async getTodos() {
      return this.findAll();
    }
    
    static async overDue(userId) {
      try{
        return this.findAll({
          where: {
            dueDate: {
              [Op.lt]: new Date(),
            },
            userId,
            completed: false,
          },
          order: [['id', 'ASC']], 
        })
      }catch (error){
        console.log(error)
      }
    }

    static async dueToday(userId) {
      try{
        return this.findAll({
          where: {
            dueDate:{
            [Op.eq]: new Date(),
          },
          userId,
          completed: false,
        },
        order: [['id', 'ASC']],
      });
      }catch (error){
        console.log(error)
      }
    }

    static async dueLater(userId) {
      try{
        return this.findAll({
          where: {
            dueDate: {
              [Op.gt]: new Date(),
            },
            userId,
            completed: false,
          },
          order: [['id', 'ASC']],
        })
      }catch(error){
        console.log(error)
      }
    }

    static async completed(userId){
      try{
        return this.findAll({
          where: {
            completed: true,
            userId
          },
        })
      }catch(error){
        console.log(error)
      }
    }

    setCompletionStatus(bool){
      return this.update({ completed: bool });
    }

    static async remove(id, userId){
      return this.destroy({where: {id: id, userId}})
    }

    static addTodo({title, dueDate, userId}){
      return this.create({title: title, dueDate: dueDate, completed: false, userId});
    }
    
    markAsCompleted() {
      return this.update({ completed: !this.completed });
    }

  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};