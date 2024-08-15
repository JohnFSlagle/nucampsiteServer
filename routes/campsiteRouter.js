const express = require("express");
const Campsite = require("../models/campsite");
const authenticate = require("../authenticate");
const cors = require("./cors");

const campsiteRouter = express.Router();

// Middleware to verify admin status
function verifyAdmin(req, res, next) {
  if (req.user && req.user.admin) {
    return next();
  } else {
    const err = new Error("You are not authorized to perform this operation!");
    err.status = 403; // Forbidden
    return next(err);
  }
}

// Routes for /campsites
campsiteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.find()
      .populate("comments.author")
      .then((campsites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsites);
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    verifyAdmin,
    (req, res, next) => {
      Campsite.create(req.body)
        .then((campsite) => {
          console.log("Campsite Created ", campsite);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(campsite);
        })
        .catch((err) => next(err));
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403; // Forbidden
      res.end("PUT operation not supported on /campsites");
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    verifyAdmin,
    (req, res, next) => {
      Campsite.deleteMany()
        .then((response) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        })
        .catch((err) => next(err));
    }
  );

// Routes for /campsites/:campsiteId
campsiteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate("comments.author")
      .then((campsite) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsite);
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403; // Forbidden
      res.end(
        `POST operation not supported on /campsites/${req.params.campsiteId}`
      );
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    verifyAdmin,
    (req, res, next) => {
      Campsite.findByIdAndUpdate(
        req.params.campsiteId,
        { $set: req.body },
        { new: true }
      )
        .then((campsite) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(campsite);
        })
        .catch((err) => next(err));
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    verifyAdmin,
    (req, res, next) => {
      Campsite.findByIdAndDelete(req.params.campsiteId)
        .then((response) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        })
        .catch((err) => next(err));
    }
  );

// Routes for /campsites/:campsiteId/comments
campsiteRouter
  .route("/:campsiteId/comments")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate("comments.author")
      .then((campsite) => {
        if (campsite) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(campsite.comments);
        } else {
          const err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.findById(req.params.campsiteId)
        .then((campsite) => {
          if (campsite) {
            req.body.author = req.user._id;
            campsite.comments.push(req.body);
            campsite
              .save()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite);
              })
              .catch((err) => next(err));
          } else {
            const err = new Error(
              `Campsite ${req.params.campsiteId} not found`
            );
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  )
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403; // Forbidden
    res.end(
      `PUT operation not supported on /campsites/${req.params.campsiteId}/comments`
    );
  })
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    verifyAdmin,
    (req, res, next) => {
      Campsite.findById(req.params.campsiteId)
        .then((campsite) => {
          if (campsite) {
            campsite.comments = [];
            campsite
              .save()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite);
              })
              .catch((err) => next(err));
          } else {
            const err = new Error(
              `Campsite ${req.params.campsiteId} not found`
            );
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  );

// Routes for /campsites/:campsiteId/comments/:commentId
campsiteRouter
  .route("/:campsiteId/comments/:commentId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate("comments.author")
      .then((campsite) => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(campsite.comments.id(req.params.commentId));
        } else if (!campsite) {
          const err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          const err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403; // Forbidden
      res.end(
        `POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`
      );
    }
  )
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then((campsite) => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          const comment = campsite.comments.id(req.params.commentId);
          if (comment.author.equals(req.user._id)) {
            if (req.body.rating) {
              comment.rating = req.body.rating;
            }
            if (req.body.text) {
              comment.text = req.body.text;
            }
            campsite
              .save()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite);
              })
              .catch((err) => next(err));
          } else {
            const err = new Error(
              "You are not authorized to update this comment!"
            );
            err.status = 403; // Forbidden
            return next(err);
          }
        } else if (!campsite) {
          const err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          const err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then((campsite) => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          const comment = campsite.comments.id(req.params.commentId);
          if (comment.author.equals(req.user._id)) {
            comment.remove();
            campsite
              .save()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite);
              })
              .catch((err) => next(err));
          } else {
            const err = new Error(
              "You are not authorized to delete this comment!"
            );
            err.status = 403; // Forbidden
            return next(err);
          }
        } else if (!campsite) {
          const err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          const err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

module.exports = campsiteRouter;
