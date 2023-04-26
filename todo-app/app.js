/* eslint-disable  */

const express = require("express");
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
var tinyCsrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");

const passport = require("passport"); // authentication
const connectEnsureLogin = require("connect-ensure-login"); //authorization
const session = require("express-session"); // session middleware for cookie support
const LocalStrategy = require("passport-local").Strategy;
const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(
  tinyCsrf("Padjdkj12990eiAAdjiosa8h6bssSain", ["POST", "PUT", "DELETE"])
);
app.set("view engine", "ejs");

app.use(
  session({
    secret: "my-super-secret-key-7218728182782818218782718hsjahsu8as8a8su88",
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hour
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done("Invalid password");
          }
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session: ", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/signup", (request, response) => {
  response.render("signup", { csrfToken: request.csrfToken() });
});

app.get("/login", (request, response) => {
  response.render("login", { csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
  // signout 
  request.logout((err) => {
    if (err) { return next(err); }
    response.redirect("/");
  })
})

app.post("/session", passport.authenticate('local', {failureRedirect: "/login"}), (request, response) => {
  console.log(request.user);
  response.redirect("/todo");
})

app.post("/users", async (request, response) => {
  // hashing a password using bcrypt
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  // Have to create user here.
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todo");
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/", async (request, response) => {
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todo",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    //
    const allTodos = await Todo.getTodos();
    const overdue = await Todo.overDue();
    const duetoday = await Todo.dueToday();
    const duelater = await Todo.dueLater();
    const completeditems = await Todo.completed();

    if (request.accepts("html")) {
      response.render("todo", {
        allTodos,
        overdue,
        duetoday,
        duelater,
        completeditems,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        allTodos,
        overdue,
        duetoday,
        duelater,
        completeditems,
      });
    }
  }
);

app.use(express.static(path.join(__dirname, "public")));

app.get("/todos", async (request, response) => {
  try {
    const allTodos = await Todo.getTodos();
    const overdue = await Todo.overDue();
    const duetoday = await Todo.dueToday();
    const duelater = await Todo.dueLater();
    const completeditems = await Todo.completed();

    if (request.accepts("html")) {
      response.render("index", {
        allTodos,
        overdue,
        duetoday,
        duelater,
        completeditems,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        allTodos,
        overDue,
        dueToday,
        dueLater,
        completedItems,
      });
    }
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("Generating a todo", request.body);
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });

    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("We have to Update todo with ID: ", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  app.get("/");
  console.log("Delete a todo by ID: ", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    return response.status(422).json(error);
  }
});

module.exports = app;
/*eslint-disable no-unused-vars */
