
import { PieceProps } from "../../../src/models/Interfaces";
import express from "express";
import Puzzles from "../models/puzzles";
import { connection } from "../server/database";
import CustomWiki from "../models/customWiki";
import CustomCentroids from "../models/customCentroids";

// eslint-disable-next-line new-cap
const router = express.Router();
// Route: <HOST>:PORT/api/users/

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
  const { pieceToSend } = req.body;
  console.log("piece:" + JSON.stringify(pieceToSend));
  const pieceProps: PieceProps = pieceToSend as PieceProps;

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
    const customWikiRepository = connection!.getRepository(CustomWiki);
    if (pieceProps.customWiki.wiki !== "") {
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
    } else {
      //delete custom centroid for this id and cartodb_id
      customWikiRepository
        .delete({
          cartodb_id: pieceProps.properties.cartodb_id,
          id: pieceProps.id,
        })
        .then(() => {
          console.log("Custom wiki deleted successfully");
          return Promise.resolve();
        })
        .catch((err) => {
          console.log("Error wiki custom centroid");
          return Promise.reject(err);
        });
    }
  }
  return Promise.resolve();
}
async function saveCustomCentroids(pieceProps: PieceProps): Promise<any> {
  if (pieceProps.customCentroid) {
    const customCentroidRepository = connection!.getRepository(CustomCentroids);
    if (
      pieceProps.customCentroid.left !== 0 ||
      pieceProps.customCentroid.top !== 0
    ) {
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
    } else {
      //delete custom centroid for this id and cartodb_id
      customCentroidRepository
        .delete({
          cartodb_id: pieceProps.properties.cartodb_id,
          id: pieceProps.id,
        })
        .then(() => {
          console.log("Custom centroid deleted successfully");
          return Promise.resolve();
        })
        .catch((err) => {
          console.log("Error deleting custom centroid");
          return Promise.reject(err);
        });
    }
  }
  return Promise.resolve();
}

export default router;
