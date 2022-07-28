import bcrypt from "bcrypt";

import { PieceProps } from "../../../src/models/Interfaces";
/*

Copyright (c) 2019 - present AppSeed.us

*/
import express from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";

import { checkToken } from "../config/safeRoutes";
import ActiveSession from "../models/activeSession";
import User from "../models/user";
import Puzzles from "../models/puzzles";
import { connection } from "../server/database";
import CustomWiki from "../models/customWiki";
import CustomCentroids from "../models/customCentroids";

// eslint-disable-next-line new-cap
const router = express.Router();
// Route: <HOST>:PORT/api/users/

const userSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(4).max(15).optional(),
  password: Joi.string().required(),
});

router.post("/register", (req, res) => {
  // Joy Validation
  const result = userSchema.validate(req.body);
  if (result.error) {
    res.status(422).json({
      success: false,
      msg: `Validation err: ${result.error.details[0].message}`,
    });
    return;
  }

  const { username, email, password } = req.body;

  const userRepository = connection!.getRepository(User);

  userRepository.findOne({ email }).then((user) => {
    if (user) {
      res.json({ success: false, msg: "Email already exists" });
    } else {
      bcrypt.genSalt(10, (_err, salt) => {
        bcrypt.hash(password, salt).then((hash) => {
          const query = {
            username,
            email,
            password: hash,
          };

          userRepository.save(query).then((u) => {
            res.json({
              success: true,
              userID: u.id,
              msg: "The user was successfully registered",
            });
          });
        });
      });
    }
  });
});

router.post("/login", (req, res) => {
  // Joy Validation
  const result = userSchema.validate(req.body);
  if (result.error) {
    res.status(422).json({
      success: false,
      msg: `Validation err: ${result.error.details[0].message}`,
    });
    return;
  }

  const { email } = req.body;
  const { password } = req.body;

  const userRepository = connection!.getRepository(User);
  const activeSessionRepository = connection!.getRepository(ActiveSession);
  userRepository.findOne({ email }).then((user) => {
    if (!user) {
      return res.json({ success: false, msg: "Wrong credentials" });
    }

    if (!user.password) {
      return res.json({ success: false, msg: "No password" });
    }

    bcrypt.compare(password, user.password, (_err2, isMatch) => {
      if (isMatch) {
        if (!process.env.SECRET) {
          throw new Error("SECRET not provided");
        }

        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            email: user.email,
          },
          process.env.SECRET,
          {
            expiresIn: 86400, // 1 week
          }
        );

        const query = { userId: user.id, token };

        activeSessionRepository.save(query);
        // Delete the password (hash)
        (user as { password: string | undefined }).password = undefined;
        return res.json({
          success: true,
          token,
          user,
        });
      }
      return res.json({ success: false, msg: "Wrong credentials" });
    });
  });
});

router.post("/logout", checkToken, (req, res) => {
  const { token } = req.body;
  const activeSessionRepository = connection!.getRepository(ActiveSession);

  activeSessionRepository
    .delete({ token })
    .then(() => res.json({ success: true }))
    .catch(() => {
      res.json({ success: false, msg: "Token revoked" });
    });
});

router.post("/checkSession", checkToken, (_req, res) => {
  res.json({ success: true });
});

router.post("/all", checkToken, (_req, res) => {
  const userRepository = connection!.getRepository(User);

  userRepository
    .find({})
    .then((users) => {
      users = users.map((item) => {
        const x = item;
        (x as { password: string | undefined }).password = undefined;
        return x;
      });
      res.json({ success: true, users });
    })
    .catch(() => res.json({ success: false }));
});

router.post("/edit", checkToken, (req, res) => {
  const { userID, username, email } = req.body;

  const userRepository = connection!.getRepository(User);

  userRepository.find({ id: userID }).then((user) => {
    if (user.length === 1) {
      const query = { id: user[0].id };
      const newvalues = { username, email };
      userRepository
        .update(query, newvalues)
        .then(() => {
          res.json({ success: true });
        })
        .catch(() => {
          res.json({
            success: false,
            msg: "There was an error. Please contract the administrator",
          });
        });
    } else {
      res.json({ success: false, msg: "Error updating user" });
    }
  });
});

//return in get response custom query from the database
router.get("/query", (req, res) => {
  const { query } = req.query;
  console.log("query:" + JSON.stringify(query));
  if (query) {
    connection!
      .query(query.toString())
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json({ success: false, msg: "No query provided" });
  }
});
//return in post response custom query from the database
router.post("/query", (req, res) => {
  const { query } = req.body;
  console.log("query:" + JSON.stringify(query));
  if (query) {
    connection!
      .query(query.toString())
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json({ success: false, msg: "No query provided" });
  }
});

// Used for tests (nothing functional)
router.get("/testme", (_req, res) => {
  res.status(200).json({ success: true, msg: "all good" });
});

router.post("/savePuzzle", (req, res) => {
  const { puzzle } = req.body;
  console.log("puzzle:" + JSON.stringify(puzzle));
  const puzzleRepository = connection!.getRepository(Puzzles);
  puzzleRepository
    .save(puzzle)
    .then(() => {
      res.json({
        success: true,
        msg: "Puzzle saved successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        msg: err.message,
      });
    });
});

router.post("/savePiece", async (req, res) => {
  const { piece } = req.body;
  console.log("piece:" + JSON.stringify(piece));
  const pieceProps: PieceProps = piece as PieceProps;

  saveCustomWiki(pieceProps).then(() => {
    res.json({
      success: true,
      msg: "Piece saved successfully",
    });
  });
  saveCustomCentroids(pieceProps).then(() => {
    res.json({
      success: true,
      msg: "Piece saved successfully",
    });
  });
});

//save custom wiki
async function saveCustomWiki(pieceProps: PieceProps): Promise<any> {
  if (pieceProps.customWiki) {
    if (pieceProps.customWiki.wiki !== "") {
      const customWikiRepository = connection!.getRepository(CustomWiki);
      customWikiRepository
        .save(pieceProps.customWiki)
        .then(() => {
          console.log("Custom wiki saved successfully");
          return Promise.resolve();
        })
        .catch((err) => {
          console.log("Error saving custom wiki");
          return Promise.reject(err);
        });
    }
  }
  return Promise.resolve();
}
async function saveCustomCentroids(pieceProps: PieceProps): Promise<any> {
  if (pieceProps.customCentroid) {
    if (
      pieceProps.customCentroid.left !== 0 ||
      pieceProps.customCentroid.top !== 0
    ) {
      const customCentroidRepository =
        connection!.getRepository(CustomCentroids);
      customCentroidRepository
        .save(pieceProps.customCentroid)
        .then(() => {
          console.log("Custom centroid saved successfully");
          return Promise.resolve();
        })
        .catch((err) => {
          console.log("Error saving custom centroid");
          return Promise.reject(err);
        });
    }
  }
  return Promise.resolve();
}

export default router;
