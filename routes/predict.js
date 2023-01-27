const express = require("express");
const dotenv = require("dotenv");
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");

const router = express.Router();

dotenv.config();

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
metadata.set("authorization", `Key ${process.env.CLARIFAI_KEY}`);

function predictImage(inputs) {
  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
        model_id: "aaa03c23b3724a16a56b629203edc62c",
        inputs: inputs,
      },
      metadata,
      (err, response) => {
        if (err) {
          reject("Error: " + err);
          return;
        }

        if (response.status.code !== 10000) {
          reject(
            "Received failed status: " +
              response.status.description +
              "\n" +
              response.status.details
          );
          return;
        }

        let results = [];
        for (const c of response.outputs[0].data.concepts) {
          results.push({
            name: c.name,
            value: c.value,
          });
        }
        resolve(results);
      }
    );
  });
}

router.post("/", async function (req, res, next) {
  try {
    const { imageUrl } = req.body;
    const inputs = [{ data: { image: { url: imageUrl } } }];
    const results = await predictImage(inputs);
    return res.send({
      results,
    });
  } catch (error) {
    return res.status(400).send({
      error: err,
    });
  }
});

module.exports = router;
