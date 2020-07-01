//////////////////////////////////////////////////////////////////// DATABASE STRUCTURE ////////////////////////////////////////////////////////////////////
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/MessageBoard", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

mongoose.Promise = global.Promise;

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

db.once("open", function () {});
//////////////////////////// SCHEMA DEFINITIONS ////////////////////////////

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "You cannot post an empty comment"],
    },
    name: {
      type: String,
      required: [true, "You cannot post a comment anonymously"],
    },
  },
  { timestamps: true }
);

const MessageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "You cannot send an empty message"],
    },
    name: {
      type: String,
      required: [true, "You cannot post a message anonymously"],
    },
    comments: [CommentSchema],
  },
  { timestamps: true }
);

//////////////////////////// MODEL INSTANTIATIONS ////////////////////////////

const Message = mongoose.model("Message", MessageSchema);

const Comment = mongoose.model("Comment", CommentSchema);

//////////////////////////////////////////////////////////////////// EXPRESS VARIABLES ////////////////////////////////////////////////////////////////////
const express = require("express");

const flash = require("express-flash");

const app = express();

const bodyParser = require("body-parser");

const path = require("path");

const session = require("express-session");

//////////////////////////////////////////////////////////////////// APP INSTANTIATION ////////////////////////////////////////////////////////////////////
app.use(
  session({
    secret: "keyboardsmashin",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "./public")));

app.use(flash());

app.set("views", path.join(__dirname, "./views"));

app.set("view engine", "ejs");

/////////////////////////////// GET ///////////////////////////////////// MESSAGE BOARD ////////////////////////////////////////////////////////////////////

app.get("/", function (request, response) {
  Message.find({})
    .sort("-createdAt")
    .exec(function (err, data) {
      response.render("index", { data });
    });
});
/////////////////////////////// POST ///////////////////////////////////// CREATE MESSAGE ////////////////////////////////////////////////////////////////////

app.post("/message", function (request, response) {
  let message = new Message(request.body);
  message.save(function (err) {
    if (err) {
      console.log("Something went wrong!:", err);
      for (var key in err.errors) {
        console.log("Added flash message");
        request.flash("registration", err.errors[key].message);
      }
      response.redirect("/");
    } else {
      response.redirect("/");
    }
  });
});

/////////////////////////////// POST ///////////////////////////////////// CREATE COMMENT ////////////////////////////////////////////////////////////////////
app.post("/comment", function (request, response) {
  Comment.create(
    { content: request.body.cmnt, name: request.body.name },
    function (err, data) {
      if (err) {
        console.log("Something went wrong!:", err);
        for (var key in err.errors) {
          request.flash("registration", err.errors[key].message);
        }
        response.redirect("/");
      } else {
        Message.findOneAndUpdate(
          { _id: request.body.message },
          { $push: { comments: data } },
          function (err) {
            if (err) {
              console.log(
                "Something went wrong when pushing the comment into the message!:",
                err
              );
              for (var key in err.errors) {
                request.flash("registration", err.errors[key].message);
              }
              response.redirect("/");
            } else {
              response.redirect("/");
            }
          }
        );
      }
    }
  );
});

/////////////////////////////// POST ///////////////////////////////////// DELETE MESSAGE ////////////////////////////////////////////////////////////////////
app.post("/destroy/:id", function (request, response) {
  console.log(request.params.id);
  Message.remove({ _id: request.params.id }, function (err) {
    if (err) {
      console.log("Something went wrong!:", err);
      for (var key in err.errors) {
        request.flash("registration", err.errors[key].message);
      }
      response.redirect("/");
    } else {
      console.log("deleted");
      response.redirect("/");
    }
  });
});

app.listen(5004, function () {
  console.log("listening on port 5004");
});
