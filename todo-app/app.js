/* eslint-disable  */
/*
const express = require("express");
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const { error } = require("console");
const flash = require("connect-flash");
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
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname + "/public")))

app.use(flash());

app.use( (request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

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
            return done(null, false, { message: "Invalid password" });
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

app.post("/session", passport.authenticate('local', {failureRedirect: "/login", failureFlash: true}), (request, response) => {
  console.log(request.user);
  response.redirect("/todo");
});

app.post("/users", async (request, response) => {
  // hashing a password using bcrypt
  if (request.body.firstName.length == 0) {
    request.flash("error", "First Name can not be empty!");
    return response.redirect("/signup");
  }
  if (request.body.email.length == 0) {
    request.flash("error", "Email address can not be empty!");
    return response.redirect("/signup");
  }
  if (request.body.password.length == 0) {
    request.flash("error", "Password can not be empty!");
    return response.redirect("/signup");
  } 
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
    const loggedInUser = request.user.id;
    const allTodos = await Todo.getTodos(loggedInUser);
    const overdue = await Todo.overDue(loggedInUser);
    const duetoday = await Todo.dueToday(loggedInUser);
    const duelater = await Todo.dueLater(loggedInUser);
    const completeditems = await Todo.completed(loggedInUser);

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
    //const title = request.body.title;
    //const dueDate = request.body.dueDate;
    if (request.body.title.length == 0) {
      request.flash("error", "Title can not be empty!");
      return response.redirect("/todo");
    }
    if (request.body.title.length <= 4) {
      request.flash("error", "Title should be minimum 5 character!");
      return response.redirect("/todo");
    }
    if (request.body.dueDate.length == 0) {
      request.flash("error", "Due date can not be empty!");
      return response.redirect("/todo");
    }
  console.log("Generating a todo", request.body);
  console.log(request.user);
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      userId: request.user.id
    });

    return response.redirect("/todo");
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
*/


/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
var cookieParser = require("cookie-parser");
var csrf = require("csurf");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");

const connectEnsureLogin = require("connect-ensure-login");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("secret string"));
app.use(csrf({ cookie: true }));

app.use(
  session({
    secret: "my-super-secret-key-7218728182782818218782718hsjahsu8as8a8su88",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(flash());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

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
          console.log(result, user.password, password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, { message: "Invalid Email" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
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

app.get("/", async function (request, response) {
    response.render("index", {
      //title: "Todo-application",
      csrfToken: request.csrfToken(),
    });
  // response.render("index");
});

app.use(express.static(path.join(__dirname, "public")));

app.get(
  "/todo",     ////////
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    const loggedInUserName = `${request.user.firstName} ${request.user.lastName}`;
    const allTodos = await Todo.getTodos(loggedInUser);
    const overdue = await Todo.overDue(loggedInUser);
    const duetoday = await Todo.dueToday(loggedInUser);
    const duelater = await Todo.dueLater(loggedInUser);
    const completeditems = await Todo.completed(loggedInUser);

    if (request.accepts("html")) {
      // const msg =request.flash("success","successfully created ")
      response.render("todo", {
        allTodos,
        overdue,
        duetoday,
        duelater,
        completeditems,
        //title: "Todo application",
        loggedInUserName,
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

app.get("/todos/:id", async function (request, response) {
  try {
    // const todo = ;
    return response.json(await Todo.findByPk(request.params.id));
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const title = request.body.title;
    const dueDate = request.body.dueDate;

    if (title.length == 0 || dueDate.length != 10) {
      request.flash("error", `Please fill in the proper details`);
      response.redirect("/todo");
    } else {
      try {
        const todo = await Todo.addTodo({
          title: title,
          dueDate: dueDate,
          userId: request.user.id,
        });

        return response.redirect("/todo");
      } catch (error) {
        console.log(error);
        return response.status(422).json(error); //unprocessable entity
      }
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE
    try {
      await Todo.remove(request.params.id, request.user.id);
      return response.json({ success: true });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    //title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  /*const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);

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
    error.errors.forEach((element) => {
      const msg = element.message;
      request.flash("error", msg);
    });

    response.redirect("/todo");    ///////
    console.log(error);
  }*/const firstName = request.body.firstName;
  const email = request.body.email;
  const password = request.body.password;
  if (firstName.length == 0 || email.length == 0 || password.length == 0) {
    console.log("Credentials Empty!");
    request.flash("error", `Missing Credentials`);
    response.redirect("/signup");
  } else {
    const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);
    try {
      const user = await User.create({
        firstName: firstName,
        lastName: request.body.lastName,
        email: email,
        password: hashedPassword,
      });

      request.login(user, (err) => {
        if (err) {
          console.error(err);
        }
        response.redirect("/todo");
      });
    } catch (error) {
      console.log(error);
    }
  }
});

app.get("/login", (request, response) => {
  response.render("login", {
    //title: "Login",
    csrfToken: request.csrfToken(),
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/todo");
  }
);

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get("/allusers", async (request, response) => {
  console.log(await User.allusers());
});

module.exports = app;